module.exports = function(connection) {

    var Q = require('q');
    //Q.longStackSupport = true;

    var models = require('./models')(connection),
        Company = models.Company,
        Team = models.Team,
        Employee = models.Employee;

    // DATA

    var companies = [
        {
            name: "alpha", 
            teams: [
                {
                    name: "alpha_programmers",
                    members: [
                        { name: "mario", surname: "rossi" }
                    ]
                },
                {
                    name: "alpha_marketing",
                    members: [
                        { name: "antonio", surname: "ferrari" },
                        { name: "francesco", surname: "russo" },
                        { name: "marco", surname: "colombo" }
                    ]
                }
            ]
        },
        {
            name: "beta", 
            teams: [
                {
                    name: "beta_programmers",
                    members: [
                        { name: "Achilles", surname: "Papadopoulos" },
                        { name: "Agenor", surname: "Vlahos" },
                        { name: "Polybus", surname: "Dimitriadis" }
                    ]
                }
            ]
        },
        {
            name: "gamma", 
            teams: [
                {
                    name: "gamma_programmers",
                    members: [
                        { name: "Bran", surname: "Murphy" },
                        { name: "Cillian", surname: "Walsh" },
                        { name: "Fiach", surname: "Smith" },
                        { name: "Torna", surname: "Doyle" }
                    ]
                }
            ]
        }
    ];

    // CONSTRUCTORS
    
    var createCompany = function(company) {
        return saveTeams(company.teams)
        .then(function(saved_teams) {
            console.log("got saved teams:");
            console.dir( saved_teams );
            var c = new Company({name: company.name, teams: saved_teams}),
                d = Q.defer();
            c.save(function(err, saved) {
                if ( err ) d.reject(err);
                else d.resolve( saved );
            });
            return d.promise;
        });
    };

    var createTeam = function(team) {
        console.log("--TEAM: " + team.name + "--------");
        return saveEmployees(team.members)
        .then(function(saved_employees) {
            console.log("   GOT SAVED EMPLOYEES:");
            console.dir(saved_employees);
            var t = new Team({name: team.name, members: saved_employees}),
                d = Q.defer();
            t.save(function(err, saved) {
                if ( err ) d.reject(err);
                else d.resolve( saved );
            });
            return d.promise
            .then(function(i) {
                console.log("--END TEAM ---" + i.name + "---------------");
                return i;
            });
        });
    };

    var createEmployee = function(employee) {
        console.log("--EMPLOYEE: " + employee.name + " -----------");
        var t = new Employee(employee),
            d = Q.defer();
        t.save(function(err, saved) {
            if ( err ) d.reject( err );
            else d.resolve( saved );
        });
        return d.promise
        .then(function(i) {
            console.log("  \\-END --- " + i.name + " ---------");
            return i;
        }, function(e) {
             console.error("can't save employee");
        });
    };

    // PROMISE CHAINING
    var saveCompanies = createCollection(createCompany),
        saveTeams = createCollection(createTeam),
        saveEmployees = createCollection(createEmployee);

    console.log("STARTING REFERENCE TESTS SETUP");

    // CLEANUP
    return Q.all([
        Q.ninvoke(Company.collection, "remove"),
        Q.ninvoke(Team.collection, "remove"),
        Q.ninvoke(Employee.collection, "remove")
    ]).then(init);

    function init() {

        console.log("STARTING FEEDING DATA TO MONGO");

        return saveCompanies(companies)
        .then(function(company_ids) {
            console.log("ALL THE COMPANIES WERE SUCCESFULLY SAVED");
        })
        .then(function() {
            var deferred = Q.defer();
            Employee.findOne({name: "marco"}, function(err, emp) {
                Employee.findOne({name: "antonio"}, function(err, man) {
                    emp.manager = man._id;
                    emp.save(function(err) {
                        deferred.resolve();
                    });
                });
            });
            return deferred.promise;
        });

    }
};

/**
 * returns a function that can be passed a collection to
 * and it will create an instance for each element in series through
 * passing the element to `contructor` and chaining the constuctors as promise chains
 *
 * constructor(collection[0]).then( constructor(collection[1]) ).then( constructor[2] )...
 * 
 * the last (returned) promise is resolved to an array of saved alement's ids
 */
function createCollection(constructor) {
    return function(collection) {
        if ( ! collection.length ) return Q(null);
        var saved_ids = [];
        return collection.slice(1).reduce(function(q, current) {
            return q.then(function(saved_previous) {
                saved_ids.push( saved_previous._id );
                return constructor(current);
            });
        }, constructor(collection[0]))
        .then(function(saved_last) {
            saved_ids.push( saved_last._id );
            return saved_ids;
        });
    };
}

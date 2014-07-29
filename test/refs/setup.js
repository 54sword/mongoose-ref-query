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
                        { name: "antonio", surname: "ferrari", age: 50 },
                        { name: "francesco", surname: "russo", age: 30 },
                        { name: "marco", surname: "colombo", age: 20 }
                    ]
                }
            ],
            revenue: 1000000
        },
        {
            name: "beta", 
            teams: [
                {
                    name: "beta_programmers",
                    members: [
                        { name: "Achilles", surname: "Papadopoulos", age: 22 },
                        { name: "Agenor", surname: "Vlahos", age: 19 },
                        { name: "Cicero", surname: "Vlahos", age: 19 },
                        { name: "Polybus", surname: "Dimitriadis", age: 42 }
                    ]
                }
            ],
            revenue: 500000
        },
        {
            name: "gamma", 
            teams: [
                {
                    name: "gamma_programmers",
                    members: [
                        { name: "Bran", surname: "Murphy", age: 28 },
                        { name: "Cillian", surname: "Walsh", age: 22 },
                        { name: "Fiach", surname: "Smith", age: 21 },
                        { name: "Torna", surname: "Doyle", age: 29 }
                    ]
                }
            ],
            revenue: 20000
        }
    ];

    // CONSTRUCTORS
    
    var createCompany = function(company) {
        return saveTeams(company.teams)
        .then(function(saved_teams) {
            console.log("got saved teams:");
            console.dir( saved_teams );
            var c = new Company({name: company.name, revenue: company.revenue, teams: saved_teams}),
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

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
            return new Company({name: company.name, revenue: company.revenue, teams: saved_teams})
            .saveQ();
        });
    };

    var createTeam = function(team) {
        return saveEmployees(team.members)
        .then(function(saved_employees) {
            return new Team({name: team.name, members: saved_employees})
            .saveQ();
        });
    };

    var createEmployee = function(employee) {
        return new Employee(employee)
        .saveQ();
    };

    // PROMISE CHAINING
    var saveCompanies = createCollection(createCompany),
        saveTeams = createCollection(createTeam),
        saveEmployees = createCollection(createEmployee);

    // CLEANUP
    return Q.all([
        Company.removeQ(),
        Team.removeQ(),
        Employee.removeQ(),
    ]).then(function init() {

        return saveCompanies(companies)
        .then(function() {
            return assignManager("marco", "antonio");
        });

    });

    function assignManager(employee_name, manager_name) {
        return Q.all([
            Employee.findOneQ({name: employee_name}),
            Employee.findOneQ({name: manager_name})
        ])
        .spread(function(employee, manager) {
            employee.manager = manager._id;
            return employee.saveQ();
        });
    }

};

var mongoose = require('mongoose'),
    config = require('../mongo.json');

var connection = mongoose.createConnection(config.host, config.db);

var models = require("./models.js")(connection),
    Company = models.Company,
    Team = models.Team;

describe('references', function(){

  testPath('/team?members.name=marco', ["alpha_marketing"], nameUnorderedMatch);

  testPath('/company?teams.members.name=marco', ["alpha"], nameUnorderedMatch);

  testPath('/employee?manager.name=antonio', ["marco"], nameUnorderedMatch);

  testPath('/team?members.age=22', ["beta_programmers", "gamma_programmers"], nameUnorderedMatch);

});

describe('complex references', function() {

    /* must contain at least one employee with name starting with C
     * and at least one of age 22, may but doesn't have to be the
     * same person */
    testExpression(
      "array-like dot notation",
      Team,
      { members: {
              name: /^C/,
              age: 22
      } },
      ["beta_programmers", "gamma_programmers"]
    );

    /* must contain at least an employee matching both the
     * conditions */
    testExpression(
      "$elemMatch on reference",
      Team,
      { members: { $elemMatch: {
          $and: [
              { name: /^C/ },
              { age: 22 }
          ]
      } } },
      ["gamma_programmers"]
    );

    /* same as above */
    testExpression(
      "$elemMatch on reference implicit $and",
      Team,
      { members: { $elemMatch: {
              name: /^C/,
              age: 22
      } } },
      ["gamma_programmers"]
    );

    /* same as above */
    testExpression(
      "double dependency query",
      Company,
      { "teams.members": { $elemMatch: {
              name: /^C/,
              age: 22
      } } },
      ["gamma"]
    );

    /* same as above */
    testExpression(
      "more complex query",
      Company,
      {
          "teams.members": { age: 22 },
          revenue: { $gt: 100000 }
      },
      ["beta"]
    );

});


"use strict";

var connection = genNewConnection();

var models = require("./models.js")(connection),
    Company = models.Company,
    Team = models.Team;

describe("references", function(){

  testPath("/team?members.name=marco", ["alpha_marketing"], nameUnorderedMatch);

  testPath("/company?teams.members.name=marco", ["alpha"], nameUnorderedMatch);

  testPath("/company?teams.members.0.name=francesco", [], nameUnorderedMatch);

  testPath("/company?teams.members.1.name=francesco", ["alpha"], nameUnorderedMatch);

  testPath("/employee?manager.name=antonio", ["marco","francesco"], nameUnorderedMatch);

  testPath("/employee?manager.manager.name=Achilles", ["Cicero","Polybus"], nameUnorderedMatch);

  testPath("/team?members.age=22", ["beta_programmers", "gamma_programmers"], nameUnorderedMatch);

});

describe("backreferences", function(){

  testPath("/employee?manages.name=francesco", ["antonio"], nameUnorderedMatch);

  it("should get by id", function(done) {
      jsonRequest("/employee?name=francesco", function (responseData) {
          var francesco_id = responseData[0]._id;
          jsonRequest("/employee?manages="+francesco_id, function(responseData) {
              expect(responseData[0].name).to.equal("antonio");
              done();
          });
      });
  });

});

describe("population", function() {

  testPath("/employee?manager.name=antonio", null, function(expected, got, done) {

    got.forEach(function(employee) {
        expect(employee.manager).to.not.have.property("name");
    });
    done();

  });

  testPath("/employee?manager.name=antonio&populate=manager", null, function(expected, got, done) {

    got.forEach(function(employee) {
        expect(employee.manager).to.have.property("name", "antonio");
    });
    done();

  });

});

describe("complex references", function() {

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


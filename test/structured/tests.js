"use strict";

var connection = genNewConnection();

var models = require("./models.js")(connection),
    Person = models.Person;

describe("function tests", function(){

  it("simple apiQueryPrepare test", function() {
    var trigger = Person.apiQueryPrepare( { name: { $in: ["Mark"] } }, {} );
    return trigger();
  });

  testExpression("$elemMatch on array of schemas", Person, { "foods": { $elemMatch: { $and: [ { name: { $in: [ /^C/ ] } }, { calories: { $in: ["20"] } }  ] } } }, ["Bela"]);

  testExpression("$elemMatch on array of schemas implicit $and", Person, { "foods": { $elemMatch: { name: { $in: [ /^C/ ] } , calories: { $in: ["20"] } } } }, ["Bela"]);

  testExpression("$or operator", Person, { $or : [{ "name": { $in: [/^X/] } }, { "age" : { $in : [12] } } ]}, ["Alena"]);

  testExpression("$or operator 2", Person, { $or : [{ "age" : { $in : [12] }}, { "name": { $in: [/^X/] } } ]}, ["Alena"]);

  testExpression("default exact mathing operator", Person, { $or : [{ "age" : 12 }, { "name": /^X/ } ]}, ["Alena"]);

});

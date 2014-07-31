"use strict";

describe("subpaths", function(){

  testPath("/smurf?foods.calories=9", ["MAG"], nameUnorderedMatch);

  testPath("/smurf?foods.records.event_name=newYear", ["MAG"], nameUnorderedMatch);

  testPath("/smurf?foods.records.amount={gt}90", ["MAG", "HUGH"], nameUnorderedMatch);

  testPath("/smurf?foods.records.0.amount=40", ["JOE"], nameUnorderedMatch);

  testPath("/smurf?foods.records.1.amount=40", ["MAG"], nameUnorderedMatch);

  testPath("/smurf?mixed.sub.subsub=subsubvalue", ["JOE"], nameUnorderedMatch);

});

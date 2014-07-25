var expect = require("expect.js"),
    request = require("request");

describe('references', function(){

  testPath('/team?members.name=marco', ["alpha_marketing"], nameUnorderedMatch);

  testPath('/company?teams.members.name=marco', ["alpha"], nameUnorderedMatch);

  testPath('/employee?manager.name=antonio', ["marco"], nameUnorderedMatch);

  // TODO if the a subelement of nested documents (not refereneced) are queried the reference mechanism shouldn't be called
 
});

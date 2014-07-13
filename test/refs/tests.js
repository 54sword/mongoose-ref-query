var expect = require("expect.js"),
    request = require("request");

describe('references', function(){

  testPath('/team?members.name=marco', ["alpha_marketing"], containsWithNames);

  testPath('/company?teams.members.name=marco', ["alpha"], containsWithNames);

  testPath('/employee?manager.name=marco', ["alpha"], containsWithNames);

  // TODO if the a subelement of nested documents (not refereneced) are queried the reference mechanism shouldn't be called
 
});

function testPath(path, expected, matcher) {
    it(path, function(done) {

        request({ url: 'http://localhost:3000' + path, json: true }, function (error, response, content) {
          matcher( expected, content, done );
        });

    });
}

function containsWithNames(expected, got, done) {
    expect(got.length).to.equal(expected.length);
    var names = got.map(function(e) { return e.name; });
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(names).to.contain(expected[i]);
    done();
}

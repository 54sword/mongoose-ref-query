var expect = require("expect.js"),
    request = require("request");


describe('schemeTypes', function(){

  testPath('/rainbow?name=albert', ['albert'], matchesUnordered);

  testPath('/rainbow?living=false', ['noe','jael'], matchesUnordered);

  testPath('/rainbow?mixed=texty', [], matchesUnordered);

  testPath('/rainbow?mixed=texty!', ['noe'], matchesUnordered);

  /* doesn't work becouse default on mixed is regex
  testPath('/rainbow?ofMixed=3', ['albert']);
  */

  testPath('/rainbow?mixed.mixedProperty=mixedvalue', ['jael'], matchesUnordered);

  testPath('/rainbow?ofMixed.anything=i want', ['albert'], matchesUnordered);

  /* should throw error 
  testPath('/rainbow?age={all}18', ['albert']);
  */

  testPath('/rainbow?age=18', ['albert'], matchesUnordered);
  
  testPath('/rainbow?ofNumber=12', ['albert', 'jael'], matchesUnordered);

  testPath('/rainbow?ofNumber=11', ['albert'], matchesUnordered);

  /* should work after adding support for structured queries
  testPath('/rainbow?ofNumber={all}12,11', ['albert']);
  */

  testPath('/rainbow?ofString={in}{regex}^a,^b', ['albert', 'noe'], matchesUnordered);

  /* have to add support for the date schema
  testPath('/rainbow?updated=2013-03-01T01:10:00', ['albert']);
  */

  /* should fail because buffer is not supported as schematype
  testPath('/rainbow?binary=cus', ['albert']);
  */

  // size operator
  testPath('/rainbow?ofNumber={size}2', ['jael'], matchesUnordered);

  /*
  describe('text index search', function() {

      // any of the words
      testPath('/rainbow?indexedText={text}pears apples', ['noe', 'jael'], matchesUnordered);

      // matches phrase
      testPath('/rainbow?indexedText={text}"some apples"', ['noe'], matchesUnordered);

      // exclude the ones containing the word apples
      testPath('/rainbow?indexedText={text}-apples', ['albert'], matchesUnordered);

      // it will search in italian language see http://docs.mongodb.org/manual/reference/operator/query/text/#op._S_text
      testPath('/rainbow?indexedText={text}pears apples,it', write rest of test );

      // works combined with other criterias
      testPath('/rainbow?indexedText={text}apples&ofNumber=12', ['jael'], matchesUnordered);

  });
  */

});


function testPath(path, expected, matcher) {

    it(path, function(done) {

        request({ url: 'http://localhost:3000' + path, json: true }, function (error, response, content) {
          matcher( expected, content, done );
        });

    });

}

function matchesUnordered(expected, got, done) {
    expect(got.length).to.equal(expected.length);
    var names = got.map(function(e) { return e.name; });
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(names).to.contain(expected[i]);
    done();
}

/** to remove
function testPath(path, expected) {
    it(path, function(done) {

        request({ url: 'http://localhost:3000' + path, json: true }, function (error, response, content) {
          expect(content.length).to.equal(expected.length);
          for ( var i = 0, ii = content.length; i < ii ; i++ )
              expect(content[i].name).to.equal(expected[i]);
          done();
        });

    });
}
*/

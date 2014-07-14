var expect = require("expect.js"),
    request = require("request");


describe('schemeTypes', function(){

  testPath('/rainbow?name=albert', ['albert']);

  testPath('/rainbow?living=false', ['noe','jael']);

  testPath('/rainbow?mixed=texty', []);

  testPath('/rainbow?mixed=texty!', ['noe']);

  /* doesn't work becouse default on mixed is regex
  testPath('/rainbow?ofMixed=3', ['albert']);
  */

  testPath('/rainbow?mixed.mixedProperty=mixedvalue', ['jael']);

  testPath('/rainbow?ofMixed.anything=i want', ['albert']);

  /* should throw error 
  testPath('/rainbow?age={all}18', ['albert']);
  */

  testPath('/rainbow?age=18', ['albert']);
  
  testPath('/rainbow?ofNumber=12', ['albert', 'jael']);

  testPath('/rainbow?ofNumber=11', ['albert']);

  testPath('/rainbow?ofNumber={all}12,11', ['albert']);

  /* has to work when added support for array element type
  testPath('/rainbow?ofString={in}{regex}^a,^b', ['albert', 'noe']);
  */

  /* have to add support for the date schema
  testPath('/rainbow?updated=2013-03-01T01:10:00', ['albert']);
  */

  /* should fail because buffer is not supported as schematype
  testPath('/rainbow?binary=cus', ['albert']);
  */

});

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

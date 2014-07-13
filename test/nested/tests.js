var expect = require("expect.js"),
    request = require("request");


describe('subpaths', function(){

  testPath('/smurf?foods.calories=9', ["MAG"]);

  testPath('/smurf?foods.records.event_name=newYear', ["MAG"]);

  testPath('/smurf?foods.records.amount={gt}90', ["MAG", "HUGH"]);

  testPath('/smurf?foods.records.0.amount=40', ['JOE']);

  testPath('/smurf?foods.records.1.amount=40', ['MAG']);

  testPath('/smurf?mixed.sub.subsub=subsubvalue', ['JOE']);

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

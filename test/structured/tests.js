var expect = require("expect.js"),
    mongooseApiQuery = require("../../lib/mongoose-api-query.js"),
    mongoose = require('mongoose'),
    config = require('../mongo.json');

var connection = mongoose.createConnection(config.host, config.db);

var models = require("./models.js")(connection),
    Person = models.Person;

describe('function tests', function(){

  it("simple apiQueryPrepare test", function() {
    var trigger = Person.apiQueryPrepare( { name: { $in: ["Mark"] } }, {} );
    return trigger();
  });

  testExpression("$elemMatch on array of schemas", { "foods": { $elemMatch: { $and: [ { name: { $in: [ /^C/ ] } }, { calories: { $in: ["20"] } }  ] } } }, ["Bela"]);

  testExpression("$elemMatch on array of schemas implicit $and", { "foods": { $elemMatch: { name: { $in: [ /^C/ ] } , calories: { $in: ["20"] } } } }, ["Bela"]);

  testExpression("$or operator", { $or : [{ "name": { $in: [/^X/] } }, { "age" : { $in : [12] } } ]}, ["Alena"]);

  testExpression("$or operator 2", { $or : [{ "age" : { $in : [12] }}, { "name": { $in: [/^X/] } } ]}, ["Alena"]);

});

function testExpression(description, expression, expected) {
    it(description, function() {

        var trigger = Person.apiQueryPrepare( expression, {} );

        return trigger().then(function(resp) {
            expect(resp.length).to.be(expected.length);
            for ( var i = 0, ii = resp.length; i < ii; i++ )
                expect(expected.indexOf(resp[i].name)).to.not.be(-1);
        });

    });
}

// checks whether two objects/arrays have the same structure
// always pass expected for a and got for b
function objectsSame (a, b) {
    var akeys = Object.keys(a),
        bkeys = Object.keys(b);

    function differentKeysMessage() {
         return "Expected object with keys " + JSON.stringify(bkeys) +
                 " to have the keys " + JSON.stringify(akeys) +
                 "\nexpected object \n" + JSON.stringify(a) +
                 "\ngot object \n" + JSON.stringify(b);
    }

    // check they have the same keys
    //expect( akeys.length ).to.be.equal( bkeys.length );
    if ( akeys.length !== bkeys.length )
        throw new Error (differentKeysMessage());
    for ( var j = 0, jj = akeys.length; j < jj ; j++ ) {
        if ( akeys[j] !== bkeys[j] )
            throw new Error (differentKeysMessage());
    }

    // check they have the same values on the corresponding keys
    for ( var i = 0, ii = akeys.length; i < ii ; i++ ) {
        var aa = a[ akeys[i] ],
            bb = b[ akeys[i] ];
        
        var typeaa = getType( aa ),
            typebb = getType( bb );
        if ( typeaa !== typebb )
            throw new Error ( "Expected property " + akeys[i] +
                              " to contain value of type " + typeaa +
                              " got type " + typebb + " instead!" );
        if ( typeof aa ===  "object" && aa !== null ) {
            objectsSame( aa, bb );
        }
        else {
            expect( aa ).to.be.equal( bb );
        }
    }
}

function getType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

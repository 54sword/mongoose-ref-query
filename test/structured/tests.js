var expect = require("expect.js"),
    mongooseApiQuery = require("../../lib/mongoose-api-query.js"),
    mongoose = require('mongoose'),
    config = require('../mongo.json');

var connection = mongoose.createConnection(config.host, config.db);

var models = require("./models.js")(connection),
    Person = models.Person;

describe('function tests', function(){

  describe('apiQueryParams', function(){

    /*
    it("parses basic value", function() {

        var input, output, expected;

        input = {
            operators: ['or'],
            args: [
                {
                    path : "name",
                    operators : [ null ],
                    args : ["Michael"]
                },
                {
                    path : "name",
                    operators : [ null ],
                    args : ["Edvard"]
                }
            ]
        };

        expected = {
            $or : [
                { name : "Michael" },
                { name : "Edvard" }
            ]
        };

        output = Person.apiQueryParams( input );

        objectsSame( expected, output );

    });

    it("skldfjlk", function() {

        var input, output, expected;

        input = {
            operators : ['and'],
            args: [
                {
                    operators: ['or'],
                    args: [
                        {
                            operators: ['gt'],
                            args: [60],
                            path: 'age'
                        },
                        {
                            operators: ['lt'],
                            args: [24],
                            path: 'age'
                        }
                    ]
                },
                {
                    operators: ['or'],
                    args: [
                        {
                            operators: [null, 'regex'],
                            args: [/^A/],
                            path: 'name'
                        },
                        {
                            operators: [null, 'regex'],
                            args: [/^B/],
                            path: 'name'
                        },
                    ]
                }
            ]
        };

        expected = {
            country : "CZ",
            $and: [
                { $or: [ { age: { $gt : 60 } }, { age: { $lt : 24 } } ] },
                { $or: [ { name: { $regex : /^A/ } }, { name: { $regex : /^B/ } } ] }
            ]
        };

        output = Person.apiQueryParams( input );

        objectsSame( expected, output );

    });
   */

  });

});

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

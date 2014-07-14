var expect = require("expect.js"),
    mongooseApiQuery = require("../../lib/mongoose-api-query.js");


describe('function tests', function(){

  describe('__parseQuery', function(){

    it("parses basic value", function() {

        var input, output, expected;

        input = {
             a : "b.c.d"
        };

        expected = {
             a: [
                 {
                      operators: [],
                      args: ["b.c.d"]
                 }
             ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("parses multiple operator", function() {

        var input, output, expected;

        input = {
            a : "{in}b{all}c"
        };

        expected = {
            a : [
                {
                    operators: ['in'],
                    args: ['b']
                },
                {
                    operators: ['all'],
                    args: ['c']
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("parses multiple arguments", function() {

        var input, output, expected;

        input = {
            a : "{in}b,c,d{in}{oop}e,f"
        };

        expected = {
            a : [
                {
                    operators: ['in'],
                    args: ['b', 'c', 'd']
                },
                {
                    operators: ['in', 'oop'],
                    args: ['e', 'f']
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("if a condition doesn't start with a primary operator the first operator will be null", function() {

        var input, output, expected;

        input = {
            a : "{in}b,c,d{iregex}e,f"
        };

        expected = {
            a : [
                {
                    operators: ['in'],
                    args: ['b', 'c', 'd']
                },
                {
                    operators: [null, 'iregex'],
                    args: ['e', 'f']
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("parses multiple arguments for multiple fields correctly", function() {

        var input, output, expected;

        input = {
            first : "{in}b,c,d{in}{oop}e,f",
            second : "{all}z,x,y{all}{oop}8,3"
        };

        expected = {
            first : [
                {
                    operators: ['in'],
                    args: ['b', 'c', 'd']
                },
                {
                    operators: ['in', 'oop'],
                    args: ['e', 'f']
                }
            ],
            second : [
                {
                    operators: ['all'],
                    args: ['z', 'x', 'y']
                },
                {
                    operators: ['all', 'oop'],
                    args: ['8', '3']
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("parsing of operators without arguments", function() {

        var input, output, expected;

        input = {
            a : "{in}{regex}{all}"
        };

        expected = {
            a : [
                {
                    operators: ['in', 'regex'],
                    args: []
                },
                {
                    operators: ['all'],
                    args: []
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("interprets escape sequences as it should", function() {

        var input, output, expected;

        input = {
            a : "{in}val\\{ue,sec\\,ond,thi\\\\rd"
        };

        expected = {
            a : [
                {
                    operators: ['in'],
                    args: ['val{ue', 'sec,ond', 'thi\\rd']
                }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output );

    });

    it("unescaped characters can cause unexpected behaviour", function() {

        var input = {
            a : "{in}val{ue"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Reached end of string inside operator!$/);

    });

    it("escaping an invalid character throws an error", function() {

        var input = {
            a : "{in}{regex}{all}th\\e val"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Invalid escape sequence/);

    });

    it("escaping the end of string throws an error", function() {

        var input = {
            a : "{in}{regex}{all}the val\\"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Escaped end of string!$/);

    });

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

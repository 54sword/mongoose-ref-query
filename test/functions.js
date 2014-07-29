var expect = require("expect.js"),
    request = require("request");

/*
 * checks whether two objects/arrays have the same structure,
 * doesn't compare regexes ( only that are both of the type RegExp )
 * always pass expected for a and got for b
 */
global.objectsSame = function objectsSame(a, b) {
    /* exported objectsSame */
    var akeys = Object.keys(a).sort(),
        bkeys = Object.keys(b).sort();

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
};

function getType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

/*
 * Makes an http request and parses the result as json,
 * a matcher must be supplied that will test if the
 * result is correct.
 */
global.testPath = function(path, expected, matcher) {
    /* exported testPath */

    it(path, function(done) {

        request({ url: 'http://localhost:3000' + path, json: true }, function (error, response, content) {
          matcher( expected, content, done, response );
        });

    });

};

/*
 * Compares the result names as a set
 * ( doesn't compare the order )
 */
global.nameUnorderedMatch = function (expected, got, done) {
    expect(got.length).to.equal(expected.length);
    var names = got.map(function(e) { return e.name; });
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(names).to.contain(expected[i]);
    done();
};

/*
 * Compares the result names as an ordered list
 */
global.nameOrderedMatch = function (expected, got, done) {
    expect(got.length).to.equal(expected.length);
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(got[i].name).to.equal(expected[i]);
    done();
};

global.containsName = function (expected, got, done) {
  expect( ~getIndexOf(got, expected) ).to.be.ok();
  done();
};

function getIndexOf(pool, searched) {
    return pool.map(function(e) { return e.name; }).indexOf(searched);
}

global.isOfNumber = function (expected, got, done) {
  expect(got.length).to.equal(expected);
  done();
};

global.inOrder = function (expected, got, done) {
  var index1 = getIndexOf(got, expected[0]);
  var index2 = getIndexOf(got, expected[1]);
  expect(index1).to.not.equal(-1);
  expect(index2).to.not.equal(-1);
  expect(index1).to.be.lessThan(index2);
  done();
};

global.testExpression = function(description, model, expression, expected) {
    it(description, function() {

        var trigger = model.apiQueryPrepare( expression );

        return trigger().then(function(resp) {
            expect(resp.length).to.be(expected.length);
            for ( var i = 0, ii = resp.length; i < ii; i++ )
                expect(expected.indexOf(resp[i].name)).to.not.be(-1);
        });

    });
};

/**
 * returns a function that can be passed a collection to
 * and it will create an instance for each element in series through
 * passing the element to `contructor` and chaining the constuctors as promise chains
 *
 * constructor(collection[0]).then( constructor(collection[1]) ).then( constructor[2] )...
 * 
 * the last (returned) promise is resolved to an array of saved alement's ids
 */
global.createCollection = function createCollection(constructor) {
    return function(collection) {
        if ( ! collection.length ) return Q(null);
        var saved_ids = [];
        return collection.slice(1).reduce(function(q, current) {
            return q.then(function(saved_previous) {
                saved_ids.push( saved_previous._id );
                return constructor(current);
            });
        }, constructor(collection[0]))
        .then(function(saved_last) {
            saved_ids.push( saved_last._id );
            return saved_ids;
        });
    };
};

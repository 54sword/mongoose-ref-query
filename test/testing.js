"use strict";

var request = require("request"),
    Q = require("q"),
    mongoose = require("mongoose-q")();

global.expect = require("expect.js");

/**
 * Unique id generator
 */
var unique = 0;
global.getUnique = function () {
    return unique++;
};

/**
 * Checks whether two objects/arrays have the same structure,
 * doesn't compare regexes ( only that are both of the type RegExp )
 * always pass expected for a and got for b.
 */
global.objectsSame = function objectsSame(a, b) {

    function differentKeysMessage() {
         return "Expected object with keys " + Object.keys(a).sort().join(", ") +
                 " to have the keys " + Object.keys(b).sort().join(", ") +
                 "\nexpected object \n" + JSON.stringify(a) +
                 "\ngot object \n" + JSON.stringify(b);
    }

    if ( ! haveSameKeys( a, b ) )
        throw new Error (differentKeysMessage());

    // check they have the same values on the corresponding keys
    for ( var i in  a ) {
        var val_a = a[i],
            val_b = b[i];

        var typea = getType( val_a ),
            typeb = getType( val_b );

        if ( typea !== typeb )
            throw new Error ( "Expected property " + i +
                              " to contain value of type " + typea +
                              " got type " + typeb + " instead!" );
        switch (typea) {
            case "object":
            case "array":
                objectsSame( val_a, val_b );
                break;
            case "regexp":
                expect( val_a.toString() ).to.be.equal( val_b.toString() );
                break;
            default:
                expect( val_a ).to.be.equal( val_b );
        }
    }
};

function getType(obj) {
    return {}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

function haveSameKeys(a, b) {
    var akeys = Object.keys(a).sort(),
        bkeys = Object.keys(b).sort();

    if ( akeys.length !== bkeys.length )
        return false;

    for ( var j = 0, jj = akeys.length; j < jj ; j++ )
        if ( akeys[j] !== bkeys[j] )
            return false;

    return true;
}

/*
 * Makes an http request and parses the result as json,
 * a matcher must be supplied that will test if the
 * result is correct.
 */
global.testPath = function(path, expected, matcher) {

    it(path, function(done) {

        request({ url: "http://localhost:3000" + path, json: true }, function (error, response, content) {
          matcher( expected, content, done, response );
        });

    });

};

/*
 * Compares the result names as a set
 * ( doesn't compare the order )
 */
global.nameUnorderedMatch = function (expected, got, done, response) {
    // check header
    var headerCount = parseInt(response.headers["x-count"]);
    expect(headerCount).to.equal(expected.length);

    // check data
    expect(got.length).to.equal(expected.length);
    var names = got.map(function(e) { return e.name; });
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(names).to.contain(expected[i]);

    done();
};

/*
 * Compares the result names as an ordered list
 */
global.nameOrderedMatch = function (expected, got, done, response) {
    expect(got.length).to.equal(expected.length);
    expect(parseInt(response.headers["x-count"])).to.equal(expected.length);
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

global.isOfNumber = function (expected, got, done, response) {
  expect(got.length).to.equal(expected);
  expect(parseInt(response.headers["x-count"])).to.equal(expected);
  done();
};

/* compare only the number of results not the http X-Count header */
global.isOfNumberNoHeader = function (expected, got, done) {
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

        var trigger = model.refQueryPrepare( expression );

        return trigger().then(function(resp) {
            expect(resp.count).to.be(expected.length);
            resp = resp.data;
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
 *
 * Could have been written without the slice by passing an empty promise as the first
 * element to reduce, but it would result in a wasted node tick.
 */
global.serialize = function serialize(constructor) {
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

/**
 * Creates new mongoose connection.
 * Should be called only by the top level script.
 */
global.genNewConnection = function genNewConnection(config) {
    config = config || require("./mongo.json");
    return mongoose.createConnection(config.host, config.db);
};

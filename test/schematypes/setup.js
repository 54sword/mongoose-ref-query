module.exports = function(connection) {

    var Q = require('q');
    //Q.longStackSupport = true;

    var models = require('./models')(connection),
        Rainbow = models.Rainbow;

    // DATA

    var rainbows = [
        {
            name: "albert",
            living: true,
            updated: new Date("2013-03-01T01:10:00"),
            binary: new Buffer(0),
            mixed: 23,
            ofMixed: [
                {
                    anything: "i want",
                    nUmb3r: 30
                },
                3
            ],
            age: 18,
            ofNumber: [12, 82, 11],
            ofString: ['abc', 'def'],
            indexedText: "This text contains some rocks."
        },
        {
            name: "noe",
            living: false,
            updated: new Date("2014-03-01T01:10:00"),
            mixed: "texty!",
            ofMixed: [
                {
                    aFrickinDate: new Date("2000-01-02T01:10:00")
                }
            ],
            ofNumber: [33, 22, 82],
            ofString: ['bbc', 'def'],
            indexedText: "This text contains some apples."
        },
        {
            name: "jael",
            living: false,
            mixed: { mixedProperty: "mixedvalue" },
            ofMixed: [],
            ofNumber: [12, 82],
            ofString: ['cbc', 'def'],
            indexedText: "This text does not contain any apples"
        }
    ];

    // PROMISE CHAINING
    var create= function(el) {
            return new Rainbow(el).saveQ();
        },
        saveElements = createCollection(create);

    // CLEANUP
    return Rainbow.removeQ().then(function init() {
        return saveElements(rainbows);
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
function createCollection(constructor) {
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
}

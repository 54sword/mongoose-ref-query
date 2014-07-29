module.exports = function(connection) {

    var Q = require('q');
    //Q.longStackSupport = true;

    var models = require('./models')(connection),
        Person = models.Person;

    // DATA

    var people = [
        {
            "name" : "Bark",
            "country" : "DE",
            "age" : 18
        },
        {
            "name" : "Alena",
            "country" : "CZ",
            "age" : 12,
            "foods" : [
                { name: "Apple", calories: 20 },
                { name: "Hamburger", calories: 30 }
            ]
        },
        {
            "name" : "Bela",
            "country" : "CZ",
            "age" : 80,
            "foods" : [
                { name: "Carrot", calories: 20 },
                { name: "Hamburger", calories: 30 }
            ]
        },
        {
            "name" : "Mark",
            "country" : "CZ",
            "age" : 10,
            "foods" : [
                { name: "Cucumber", calories: 5 }
            ]
        }
    ];

    // PROMISE CHAINING
    var create= function(el) {
            return new Person(el).saveQ();
        },
        saveElements = createCollection(create);

    // CLEANUP
    return Person.removeQ().then(function init() {
        return saveElements(people);
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

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
            "age" : 12
        },
        {
            "name" : "Bela",
            "country" : "CZ",
            "age" : 80
        },
        {
            "name" : "Mark",
            "country" : "CZ",
            "age" : 10
        }
    ];

    // CONSTRUCTORS
    
    var create= function(el) {
        var t = new Person(el),
            d = Q.defer();
        t.save(function(err, saved) {
            if ( err ) d.reject( err );
            else d.resolve( saved );
        });
        return d.promise;
    };

    // PROMISE CHAINING
    var saveElements = createCollection(create);

    // CLEANUP
    return Q.ninvoke(Person.collection, "remove").then(init);

    function init() {

        console.log("STARTING FEEDING DATA TO MONGO");

        return saveElements(people)
        .then(function(ids) {
            console.log("ALL PEOPLE SAVED");
        });

    }
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

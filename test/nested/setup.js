module.exports = function(connection) {

    var Q = require('q');
    //Q.longStackSupport = true;

    var models = require('./models')(connection),
        Smurf = models.Smurf;

    // DATA

    var smurfs = [
        {
            name: "JOE", 
            eats_humans: false,
            foods: [
                {
                    name: "carrot",
                    vegetarian: true,
                    calories: 3,
                    records: [ { event_name: 'easter', amount: 40 }, { event_name: 'christmass', amount: 90 } ]
                }
            ],
            mixed: {
                sub: {
                    subsub: 'subsubvalue'
                }
            }
        },
        {
            name: "MAG", 
            eats_humans: true,
            foods: [
                {
                    name: "broccoli",
                    vegetarian: true,
                    calories: 9,
                    records: [ { event_name: 'newYear', amount: 100 }, { event_name: 'thanksgiving', amount: 40 } ]
                }
            ]
        },
        {
            name: "HUGH", 
            eats_humans: false,
            foods: [
                {
                    name: "tomato",
                    vegetarian: true,
                    calories: 40,
                    records: [ { event_name: 'easter', amount: 120 } ]
                }
            ],
            memories: [
                { name: "first kiss", location: [38.8977,-77.0366] }
            ]
        }
    ];

    // PROMISE CHAINING
    var createSmurf = function(smurf) {
            return new Smurf(smurf).saveQ();
        },
        saveSmurfs = createCollection(createSmurf);

    return Smurf.removeQ().then(function() {
        return saveSmurfs(smurfs);
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

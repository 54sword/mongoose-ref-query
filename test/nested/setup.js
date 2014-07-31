"use strict";

module.exports = function(connection) {

    var models = require("./models")(connection),
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
                    records: [ { event_name: "easter", amount: 40 }, { event_name: "christmass", amount: 90 } ]
                }
            ],
            mixed: {
                sub: {
                    subsub: "subsubvalue"
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
                    records: [ { event_name: "newYear", amount: 100 }, { event_name: "thanksgiving", amount: 40 } ]
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
                    records: [ { event_name: "easter", amount: 120 } ]
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
        saveSmurfs = serialize(createSmurf);

    return Smurf.removeQ().then(function() {
        return saveSmurfs(smurfs);
    });

};

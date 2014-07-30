"use strict";

module.exports = function(connection) {

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
            ofString: ['cbc', 'def', ''],
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

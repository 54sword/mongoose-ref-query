"use strict";

module.exports = function(connection) {

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

"use strict";

module.exports = function(connection) {

    var mongoose = require("mongoose-q")(),
        mongooseRefQuery = require("../../lib/mongoose-ref-query");

    var Schema = mongoose.Schema;

    var personSchema = Schema({
        name:    String,
        age:     Number,
        country: String,
        foods: [Schema({
            name: String,
            calories: Number
        })]
    });

    personSchema.plugin(mongooseRefQuery);

    return {
        Person: connection.model("Person", personSchema)
    };

};

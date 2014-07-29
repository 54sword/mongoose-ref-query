"use strict";

module.exports = function(connection) {

    var mongoose = require('mongoose-q')(),
        mongooseApiQuery = require('../../lib/mongoose-api-query');

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

    personSchema.plugin(mongooseApiQuery);

    return {
        Person: connection.model('Person', personSchema)
    };

};

module.exports = function(connection) {

    var mongoose = require('mongoose'),
        mongooseApiQuery = require('../../lib/mongoose-api-query');

    var Schema = mongoose.Schema;

    var personSchema = new mongoose.Schema({
        name:    String,
        age:     Number,
        country: String
    });

    personSchema.plugin(mongooseApiQuery);

    return {
        Person: connection.model('Person', personSchema)
    };

};

module.exports = function(connection) {

    //var mongoose = require('mongoose-q')(require('mongoose')),
    var mongoose = require('mongoose'),
        mongooseApiQuery = require('../../lib/mongoose-api-query'),
        Schema = mongoose.Schema;

    var ObjectId = Schema.Types.ObjectId;

    var schemas = {
        Company : new Schema({
                          name: String,
                          teams: [{ type: ObjectId, ref: 'Team'}]
                        }),
        Team : new Schema({
                       name: String,
                       members: [{ type: ObjectId, ref: 'Employee'}]
                     }),
        Employee : new Schema({
                           name: String,
                           surname: String,
                           manager: { type: ObjectId, ref: 'Employee' }
                         })
    };

    var models = {};

    for ( var name in schemas ) {
        var schema = schemas[name];
        schema.plugin(mongooseApiQuery);
        models[name] = connection.model(name, schema);
    }

    return models;

};

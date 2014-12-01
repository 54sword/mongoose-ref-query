"use strict";

module.exports = function(connection) {

    var mongoose = require("mongoose-q")(),
        mongooseRefQuery = require("../../lib/mongoose-ref-query"),
        Schema = mongoose.Schema;

    var ObjectId = Schema.Types.ObjectId;

    var schemas = {
        Company : new Schema({
                          name: String,
                          teams: [{ type: ObjectId, ref: "Team"}],
                          revenue: Number
                        }),
        Team : new Schema({
                       name: String,
                       members: [{ type: ObjectId, ref: "Employee"}]
                     }),
        Employee : new Schema({
                           name: String,
                           surname: String,
                           manager: { type: ObjectId, ref: "Employee" },
                           age: Number,
                         })
    };

    var models = {};


    schemas.Employee.plugin(mongooseRefQuery, {
        backreferences: {
            manages: {
                model: "Employee",
                property: "manager"
            }
        }
    });

    for ( var name in schemas ) {
        var schema = schemas[name];
        if (name!=="Employee")
            schema.plugin(mongooseRefQuery, {});
        models[name] = connection.model(name, schema);
    }

    return models;

};

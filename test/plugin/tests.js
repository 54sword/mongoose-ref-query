"use strict";

var mongooseApiQuery = require("../../lib/mongoose-api-query.js"),
    mongoose = require("mongoose-q")();

describe("http GET request parsing", function(){

    it("throws error on invalid operator", function() {

        var input;

        input = {
             name : "{invalidop}hey"
        };

        expect(function() {
            mongooseApiQuery.__parseQuery( input );
        }).to.throwException(/^Invalid secondary operator/);

    });

    it("should work", function() {

        var model, schema;

        schema = new mongoose.Schema({ name: String });
        schema.plugin( mongooseApiQuery );
        model = mongoose.model("car"+getUnique(), schema);

        expect(function() {
            model.refQuery({ name : "ferrari" });
        }).to.not.throwException();

    });

    it("can be set to ignore errors", function() {

        var model, schema, query;

        schema = new mongoose.Schema({ name: String });
        schema.plugin( mongooseApiQuery, { throwErrors: false });
        model = mongoose.model("car"+getUnique(), schema);

        expect(function() {
            query = model.refQuery({ age : "100" });
        }).to.not.throwException();

    });

    it("by default throws errors", function() {

        var model, schema, query;

        schema = new mongoose.Schema({ name: String });
        schema.plugin( mongooseApiQuery );
        model = mongoose.model("car"+getUnique(), schema);

        expect(function() {
            // the error is thrown already during the parsing phase
            query = model.refQuery({ age : "100" });
        }).to.throwException(/The given schema has no path "age"!/);

    });

    it("checks paths even on references", function() {

        var query,
            refdModelName = "REFDMODEL"+getUnique();

        var schema1 = new mongoose.Schema({ name: String, relationship: { ref: refdModelName, type: mongoose.Schema.Types.ObjectId }}),
            schema2 = new mongoose.Schema({ age: Number });

        schema1.plugin( mongooseApiQuery, { throwErrors: true } );
        schema2.plugin( mongooseApiQuery, { throwErrors: true } );

        mongoose.model(refdModelName, schema2);
        var model1 = mongoose.model("referencing"+getUnique(), schema1);

        expect(function() {
            query = model1.refQuery({ "relationship.age" : "100" });
        }).to.not.throwException();

    });

    it("checks paths even on references", function() {

        var query,
            refdModelName = "REFDMODEL"+getUnique();

        var schema1 = new mongoose.Schema({ name: String, relationship: { ref: refdModelName, type: mongoose.Schema.Types.ObjectId }}),
            schema2 = new mongoose.Schema({ age: Number });

        schema1.plugin( mongooseApiQuery, { throwErrors: true } );
        schema2.plugin( mongooseApiQuery, { throwErrors: true } );

        mongoose.model(refdModelName, schema2);
        var model1 = mongoose.model("referencing"+getUnique(), schema1);

        expect(function() {
            query = model1.refQuery({ "relationship.name" : "100" });
        }).to.throwException(/The given schema has no path "name"!/);

    });

});

"use strict";

module.exports = function(connection) {

    var mongoose = require("mongoose-q")(),
        mongooseApiQuery = require("../../lib/mongoose-api-query");

    var Schema = mongoose.Schema;

    var rainbowSchema = new mongoose.Schema({
        name:    String,
        binary:  Buffer,
        living:  Boolean,
        updated: { type: Date, default: Date.now },
        age:     { type: Number, min: 18, max: 65 },
        mixed:   Schema.Types.Mixed,
        _someId: Schema.Types.ObjectId,
        array:      [],
        ofString:   [String],
        ofNumber:   [Number],
        ofDates:    [Date],
        ofBuffer:   [Buffer],
        ofBoolean:  [Boolean],
        ofMixed:    [Schema.Types.Mixed],
        ofObjectId: [Schema.Types.ObjectId],
        indexedText: String
    });

    rainbowSchema.index({"indexedText": "text"});
    rainbowSchema.plugin(mongooseApiQuery);

    return {
        Rainbow: connection.model("Rainbow", rainbowSchema)
    };

};

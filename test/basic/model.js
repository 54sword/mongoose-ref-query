module.exports = function(connection) {

    var mongoose = require('mongoose'),
        mongooseApiQuery = require('../../lib/mongoose-api-query');

    var monsterSchema = new mongoose.Schema({
      name: String,
      monster_identification_no: Number,
      eats_humans: Boolean,
      foods: [ new mongoose.Schema({
        name: String,
        vegetarian: Boolean,
        calories: Number
      })],
      loc: Array,
      data: {} // mixed
    });

    monsterSchema.index({'loc':'2d'});
    monsterSchema.plugin(mongooseApiQuery);

    return connection.model('Monster', monsterSchema);

}

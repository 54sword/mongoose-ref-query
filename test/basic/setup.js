"use strict";

module.exports = function(connection) {

    var models = require("./models")(connection),
        Monster = models.Monster,
        monsters = require("./fixtures");

    return Monster.removeQ()
    .then(function() {
        return serialize(function(monster) {
            return new Monster(monster).saveQ();
        })(monsters);
    });

};

module.exports = function(connection) {

    var mongoose = require('mongoose-q')(require('mongoose')),
        Q = require('q');

    var Monster = require('./model')(connection),
        monsters = require('./fixtures');

    return Monster.removeQ()
    .then(function() {
        return monsters.reduce(function(promise, next_monster) {
            return promise.then(function(last_monster) {
                return new Monster(next_monster).saveQ();
            });
        }, Q(true));
    });

};

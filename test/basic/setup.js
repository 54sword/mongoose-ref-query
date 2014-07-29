"use strict";

module.exports = function(connection) {

    var Q = require('q');

    var Monster = require('./model')(connection),
        monsters = require('./fixtures');

    return Monster.removeQ()
    .then(function() {
        return monsters.reduce(function(promise, next_monster) {
            return promise.then(function() {
                return new Monster(next_monster).saveQ();
            });
        }, Q(true));
    });

};

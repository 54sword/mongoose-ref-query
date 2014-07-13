module.exports = function(connection) {

    var mongoose = require('mongoose'),
        Q = require('q');

    var Monster = require('./model')(connection),
        monsters = require('./fixtures');

    var d = Q.defer();

    var addMonsters = function (monsters) {
      var m = new Monster(monsters.shift());
      m.save(function(err) {
        if ( err ) d.reject(err);
        if (monsters.length === 0) {
            console.log("ALL MONSTERS SAVED");
            d.resolve();
        } else {
          addMonsters(monsters);
        }
      });
    };

    Monster.collection.remove(function(err) {
        if ( err ) d.reject( err );
        console.log("STARTING FEEDING DATA TO MONGO");
        addMonsters(monsters);
    });

    return d.promise;
};

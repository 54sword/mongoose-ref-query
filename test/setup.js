var glob = require('glob'),
    mongoose = require('mongoose'),
    Q = require('q');

var config = require('./mongo.json'),
    connection = mongoose.createConnection(config.host, config.db);

var setup_scripts = glob.sync('./*/setup.js', { cwd: __dirname });

serialize( setup_scripts )
.then(function() {

    console.log("ALL SETUP SCRIPTS DONE!!!");
    connection.close();

}).done();

function serialize(scripts) {

    if ( ! scripts.length ) return Q(null);

    console.log( formatName(scripts[0]) + " STARTING");

    return scripts.slice(1).reduce(function(q, script, i) {

        return q.then(function(last_result) {

            console.log( formatName(scripts[i]) + " DONE !\n");

            console.log( formatName(scripts[i+1]) + " STARTING");
            return require(script)(connection); 

        });

    }, require(scripts[0])(connection))
    .then(function(last_result) {
        console.log( formatName(scripts[scripts.length-1]) + " DONE !\n");
    });

}

function formatName(path) {
    return path.toUpperCase().slice(2).replace(/\/.*/, '');
}

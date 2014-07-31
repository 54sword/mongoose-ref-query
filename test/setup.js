"use strict";

// global testing functions
require("./testing.js");

var glob = require("glob"),
    connection = genNewConnection();

var runScriptsSerially = serialize(function(script) {
    var formatted = script.toUpperCase().replace(/.*\/([^\/]*)\/[^\/]*$/, "$1");
    console.log( formatted + " STARTING");
    return require(script)(connection)
           .then(function(r) {
               console.log( formatted + " DONE !\n");
               return r;
           });
});

var setup_scripts = glob.sync("./*/setup.js", { cwd: __dirname });

runScriptsSerially( setup_scripts )
.then(function() {
    console.log("ALL SETUP SCRIPTS DONE!!!");
    connection.close();
}).done();

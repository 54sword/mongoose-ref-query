"use strict";

// global testing functions
require("./testing.js");

var express = require("express"),
    http = require("http"),
    glob = require("glob"),
    fs = require("fs");

var connection = genNewConnection(),
    app = express();

app.configure(function(){
  app.set("port", process.env.PORT || 3000);
  app.use(express.logger("dev"));
  app.use(app.router);
});

app.configure("development", function(){
  app.use(express.errorHandler());
});

// each test suite can register it's own routes
glob.sync("./*/", { cwd: __dirname }).forEach(function(folder) {
   var routesjs = folder+"routes.js";
   if ( fs.existsSync(routesjs) ) {
       // the test suite might want to perform other tasks on the server
       require(routesjs)(app, connection);
   }
   else {
       if ( ! fs.existsSync(folder+"models.js") ) return;
       var models = require(folder+"models")(connection);
       routesFromModels(app, models);
   }
});

function routesFromModels(app, models) {
   for ( var i in models ) {
   (function(name, model) {

       app.get("/"+name.toLowerCase(), function handler(req, res) {

           model.refQuery(req.query)()
           .then(function(results) {
             res.setHeader("X-Count", results.count);
             res.send(results.data);
           }).done();

       });

   })(i, models[i]);
   }
}

http.createServer(app).listen(app.get("port"), function(){
  console.log("Express server listening on port " + app.get("port"));
});

process.on("uncaughtException", function(e) {
    console.log("unhandledException");
    console.log(e);
    console.log(e.stack);
});

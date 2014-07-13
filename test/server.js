var express = require('express'),
    http = require('http'),
    glob = require('glob'),
    mongoose = require('mongoose');

var config = require('./mongo.json'),
    connection = mongoose.createConnection(config.host, config.db);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// each test suite can register it's own routes
glob.sync('./*/routes.js', { cwd: __dirname }).forEach(function(route) {
   require(route)(app, connection); 
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

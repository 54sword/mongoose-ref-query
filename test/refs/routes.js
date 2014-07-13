module.exports = function(app, connection) {

    var models = require('./models')(connection);

    for ( var i in models ) {
    (function(name, model) {

        var model = models[name];

        app.get('/'+name.toLowerCase(), function handler(req, res) {

            model.apiQuery(req.query).exec(function(err, monsters) {
              res.send(monsters);
            });

        });

    })(i, models[i]);
    };

};

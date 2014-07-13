module.exports = function(app, connection) {

    var Monster = require('./model')(connection);

    app.get('/monster', function handler(req, res) {

        Monster.apiQuery(req.query).exec(function(err, monsters) {
          res.send(monsters);
        });

    });

};

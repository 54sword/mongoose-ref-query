module.exports = function(app, connection) {

    var Monster = require('./model')(connection);

    app.get('/monster', function handler(req, res) {

        Monster.apiQuery(req.query).exec().then(function(monsters) {
          res.send(monsters);
        }).done();

    });

};

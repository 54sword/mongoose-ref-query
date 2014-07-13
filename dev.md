DEV NOTES
=========

TODO
----

- tests for population
- ? check if not operator is used the right way
- ? string regex 
- add fields parameter test
- ? add casting to type operator for mixed schema  ?data.age={number}5
- write a test for exact number matching
- ? add multiple operator match ?name={in}{exact}Joe,Mag 
- add support for all the schematypes & check the existing ones
    missing:
    - date
    - buffer
- geo indexes ? operators ?
- add support for escaped comma in lists ?name={in}a\,b,c would return all that match "a,b" or "c"
        just replace val.split(',') with custom state-machine function
- add support for curly brackets is values ?name=myn\{name would return all that match "myn{ame"
- grouping of queries
    - or operator ?{or}(foods.records.amout={lt}5{gt}0|foods.records.amount={gt}1000)
      returns all that matches ( 0 < amount < 5 ) || ( amount > 1000 )
    - {elemMatch}
    - probably through a filter that would map such a syntax to a structured object

## Testing

```shell
node test/setup.js
node test/server.js &
npm test
```

- **setup.js** - saves the testing data to mongo
- **server.js** - runs an http server to query
- `npm test` - runs the mocha testing framework

The tests are divided into folders. Eeach suite must contain it's own

| filename  | exports                    | description
|-----------|----------------------------|-----------------------------------------------------------------
| setup.js  | function(mongo_connection) | to setup the database to an initial state
| routes.js | function(app)              | to register the routes on the server for the testing framework
| tests.js  | <nothing>                  | the mocha tests

mongo links
-----------

[format](http://docs.mongodb.org/manual/tutorial/query-documents/)
[operators](http://docs.mongodb.org/manual/reference/operator/query/)


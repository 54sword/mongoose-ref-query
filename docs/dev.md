DEV NOTES
=========

TODO
----

- there's an empty criteria in the $and array of the manager.manager.name query of refs
- write test that prepares multiple queries and then runs them at once
- check other forks for usefull features
- write a test for exact number matching
- add testing for errors
- structured tests for schematypes one tests.js file for each type
- throw errors on wrong number of arguments supplied to given operator
- write client escaping library

- add casting to type operator for mixed schema  ?data.age={number}5
- add support for all the schematypes & check the existing ones \
    missing:
    - date
    - buffer
- geo indexes ? operators ?
- score processing on $text search
- mongoose populate seems to support only direct references ( you cannot say populate=manager.manager )

- structured queries
    - all operator ( cast the args on array queries    /smurfs?eats={all}{regex}uk$,en$
      only all the smurfs eating at least one of the vegetables ending with "uk" and at lest one ending with "en"
      => { smurfs : { $all : { $in : [ /uk$/, /en$/ ] } } } )
    - or operator ?{or}(foods.records.amout={lt}5{gt}0|foods.records.amount={gt}1000)
      returns all that matches ( 0 < amount < 5 ) || ( amount > 1000 )
    - {elemMatch}

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

## Notes

For the default operator of for the pseudo operator `eq` the `in` operator is used so that multiple conditions can be set on a single path.
( For the same reason the `all` operator is not used and is substitudet by an `and` containing and `in` (see notes.md) )

```
/monster?monster-number=1{lt}2
results in the query
{ monster-bumber : { $in : [ 1 ], $lt : 2 } }
```

this query would not be possible without using the $in operator ( there would be no property name ).


#### Operators to consider

Braching operators : $not, $nor

On mixed and arrays might consider : $exists, $type

$size does not accept ranges or further query expressions.

Geo operators.

$where ???

see [operators](operators.md)

Mongo links
-----------

[format](http://docs.mongodb.org/manual/tutorial/query-documents/)
[operators](http://docs.mongodb.org/manual/reference/operator/query/)

[comparison\_operators](http://docs.mongodb.org/manual/reference/operator/query/#comparison)

Mongo terms
-----------

Might want to rename the variables according to them.

- `query expression` - any criteria or structure of criterias

# REFERENCE BASED QUERIES STRATEGIES

Each reference based subquery will result in a `$in` matching expression with a list of ids from the result of the subquery.
The array can be returned *before* the query is resolved and flag it as a promise `[].__ispromise = true`. When the query
is executed the array can be populated with ids and throw an event signaling the resolvement of the promise.
When all the expressions are returned the tree must be scanned for promises and an event handler must be registered.
All this must be processed in one tick so that the promise is not resolved before the handler registration.

The main query is processed in the then block of a `Q.all([ <all_the_expression_promises> ]).then(execute_main_query)` alike call.


## Overview

If you use Mongoose to help serve results for API calls, you might be used to handling calls like:

    /monsters?color=purple&eats_humans=true

mongoose-api-query handles some of that busywork for you. Pass in a vanilla object (e.g. req.query) and query conditions will be cast to their appropriate types according to your Mongoose schema. For example, if you have a boolean defined in your schema, we'll convert the `eats_humans=true` to a boolean for searching.

It also adds support for

- the **mongo operators**, like
    - comparison  **lt**, **gt**, **ne**
    - geosearch **near** (for geosearch)
    - array search **in**, and **all**
- the monngo **dot notation** to access elements at specified index as `/teams?members.0.name=joe` will return only the teams whose first employees' name is joe

You can find a full list below.

It can check that the query matches the schema and if not throw an error ( disabled by default ).

**Will probably change!!!** When searching strings, by default it does a partial, case-insensitive match. (Which is not the default in MongoDB.)

## Current Limitations

Can't check if string is empty.

## Usage

Apply the plugin to any schema in the usual Mongoose fashion:

```
monsterSchema.plugin(mongooseApiQuery[, options]);
```

Then call it like you would using `Model.find`. This returns a Mongoose.Query:

```
Monster.apiQuery(req.query).exec(...
```

Or pass a callback in and it will run `.exec` for you:

```
Monster.apiQuery(req.query, function(err, monsters){...
```

The entire function prototype is 

```
.apiQuery(query_object[, callback[, fields]])

```

*fields* is a string list of fields in the mongoose fashion

## Examples

`t`, `y`, and `1` are all aliases for `true`:

```
/monsters?eats_humans=y&scary=1
```

Match on a nested property:

```
/monsters?foods.name=kale
```

Use exact matching:

```
/monsters?foods.name={exact}KALE
```

Matches either `kale` or `beets`:

```
/monsters?foods.name=kale,beets
```

Matches only where `kale` and `beets` are both present:

```
/monsters?foods.name={all}kale,beets
```

Numeric operators:

```
/monsters?monster_id={gte}30&age={lt}50
```

Combine operators:

```
/monsters?monster_id={gte}30{lt}50
```

geo near, with (optional) radius in miles:

```
/monsters?latlon={near}38.8977,-77.0366
/monsters?latlon={near}38.8977,-77.0366,10
```

dot notation

```
/teams?members.0.name=joe - only the teams whose first members' name is joe
/teams?members.name=joe - only the teams whose any members' name is joe
```

## Coordinates

The operator `near` can be applied on schemaType `[]` or `[<type>]`. ( ? should be enforced number ? )

## Pagination

```
/monsters?page=2
/monsters?page=4&per_page=25 		// per_page defaults to 10
```

## Sorting results

```
/monsters?sort_by=name
/monsters?sort_by=name,desc
```

## Default order

Mongo by default returns it's results as they are located on the disk which can change due to reallocation ( see [natural order](http://docs.mongodb.org/manual/reference/glossary/#term-natural-order) ).
Sorting by ObjectId returns them in order of creation if the ids are server generated ( see [ObjectId](http://docs.mongodb.org/manual/reference/glossary/#term-objectid) ), but mongoose sends it's own
to the server, so i suppose it's not the case.

## Population

**!!! NOT TESTED !!!**

```
/monsters?populate=family,neighbours
```

## Schemaless search

If you specify a criteria on a path or subpath of a typescheme Mixed then
all the operators will be avaiable and no further checking will be made.

Querying subpaths of a path defined as empty array ( without specifying element's schema ) will behave the same.

## Search Operators

This is a list of the optional search operators you can use for each SchemaType.

#### ATTENTION

In your code you should **ALWAYS** use an explicit primary operator for each criteria, **NEVER** apply the default for the following reason:

suppose eats is an array of strings

```
/monsters?eats={all}Carrot,Tomato{regex}n$
```

maps to all the monsters that eat Carrots **and** Tomato and also eats at least one item ending with *n*.

But if the user doesn't supply any data, the query would result in

```
/monsters?eats={all}{regex}n$
```

Which would return all the monstears that eats **only** items ending with *n*. This can be fixed by explicitly defining a primary operator *in*.

```
/monsters?eats={all}Carrot,Tomato{in}{regex}n$ -> /monsters?eats={all}{in}{regex}n$
```

For this purpose we also add the primary operator `eq` as the explicit form of the default matching with a single value.

**TODO write tests for this.**

#### Number

- `number={all}123,456` - Both 123 and 456 must be present
- `number={nin}123,456` - Neither 123 nor 456
- `number={in}123,456` - Either 123 or 456
- `number={gt}123` - > 123
- `number={gte}123` - >= 123
- `number={lt}123` - < 123
- `number={lte}123` - <=123
- `number={ne}123` - Not 123
- `number={mod}10,2` - Where (number / 10) has remainder 2

#### String

- `string={all}match,batch` - Both match and batch must be present
- `string={nin}match,batch` - Neither match nor batch
- `string={in}match,batch` - Either match or batch
- `string={not}coffee` - Not coffee
- `string={exact}CoFeEe` - Case-sensitive exact match of "CoFeEe"

- `string={text}apple pear` - search on text index ( requires mongodb version >=2.4.6 )
- `string={text}apple pear,it` - search on text index in italian
- `string={text}"some apples"` - search on text index whole phrase

#### Boolean

- `t`, `y`, and `1` are all aliases for `true` anything else will be evaluated as `false`

#### Array

- `array={all}match,batch` - Both match and batch must be present
- `array={nin}match,batch` - Neither match nor batch
- `array={in}match,batch` - Either match or batch
- `latlon={near}37,-122,5` - Near 37,-122, with a 5 mile max radius
- `latlon={near}37,-122` - Near 37,-122, no radius limit. Automatically sorts by distance

#### Mixed

Since a Mixed Schematype can contain **anything** you can apply any operator of any of the other schematypes.

- `number={all}123,456` - Both 123 and 456 must be present
- `number={nin}123,456` - Neither 123 nor 456
- `number={in}123,456` - Either 123 or 456
- `number={gt}123` - > 123
- `number={gte}123` - >= 123
- `number={lt}123` - < 123
- `number={lte}123` - <=123
- `number={ne}123` - Not 123
- `string={not}coffee` - Not coffee
- `number={mod}10,2` - Where (number / 10) has remainder 2
- `latlon={near}37,-122,5` - Near 37,-122, with a 5 mile max radius
- `latlon={near}37,-122` - Near 37,-122, no radius limit. Automatically sorts by distance

## To run tests

See [dev.md](dev.md)

## License

MIT http://mit-license.org/

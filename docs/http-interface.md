# HTTP interface syntax

Http query objects like this

```
/monsters?name=joe&age={gt}20{lt}100
```

are transformed into a mongo $and expressions like this:

```
{ $and: [
        { name: 'joe' },
        { age: { $gt: 20 } },
        { age: { $lt: 100 } }
] }
```

Multiple argument operators take arguments as comma separated list, the comma can be escaped with a backslash.

## Coordinates

The operator `near` can be applied on schemaType `[]` or `[<type>]`. ( ? should be enforced number ? )

geo near, with (optional) radius:

```
/monsters?latlon={near}38.8977,-77.0366
/monsters?latlon={near}38.8977,-77.0366,10
```

## Dot notation

It supports the standart mongo dot notation

```
/teams?members.0.name=joe - only the teams whose first members' name is joe
/teams?members.name=joe - only the teams whose any members' name is joe
```

## Schemaless search

If you specify a criteria on a path or subpath of a typescheme Mixed then
all the operators will be avaiable and no further checking will be made.

Querying subpaths of a path defined as empty array ( without specifying element's schema ) will behave the same.

## Params

### Pagination

```
/monsters?page=2
/monsters?page=4&per_page=25 		// per_page defaults to 10
```

### Sorting results

```
/monsters?sort_by=name
/monsters?sort_by=name,desc
```

#### Default order

Mongo by default returns it's results as they are located on the disk which can change due to reallocation ( see [natural order](http://docs.mongodb.org/manual/reference/glossary/#term-natural-order) ).
Sorting by ObjectId returns them in order of creation if the ids are server generated ( see [ObjectId](http://docs.mongodb.org/manual/reference/glossary/#term-objectid) ), but mongoose sends it's own
to the server, so i suppose it's not the case.

### Population

```
/monsters?populate=family,neighbours
```

## !! ATTENTION !!

In your code you should **ALWAYS** use an explicit primary operator for each criteria, **NEVER** apply the default for the following reason:

suppose eats is an array of strings

```
/monsters?eats={nin}Carrot,Tomato{regex}n$
```

maps to all the monsters that eat only food different than Carrots and Tomatos and at least one of the foods must end with n.

But if the user doesn't supply any data, the query would result in

```
/monsters?eats={nin}{regex}n$
```

Which would return all the monsters that eat only items not ending with `n`. This can be fixed by explicitly defining a primary operator `in`.

```
/monsters?eats={all}Carrot,Tomato{in}{regex}n$
/monsters?eats={all}{in}{regex}n$
```

For this purpose we also add the primary operator `eq` as the explicit form of the default matching with a single value.

## Secondary operators

These are operators that can be used to alter how the passed in value is handled.

- `regex` - converts the argument into a regular expression
- `iregex` - converts the argument into a case insensitive regular expression
- `null` - will insert a null into the query ( the argument must be empty string )

## SCHEMATYPES

### Number

- `number={in}123,456` - Either 123 or 456
- `number={gt}123` - > 123
- `number={gte}123` - >= 123
- `number={lt}123` - < 123
- `number={lte}123` - <=123
- `number={ne}123` - Not 123
- `number={mod}10,2` - Where (number / 10) has remainder 2
- `number={all}123,456` - Both 123 and 456 must be present
- `number={nin}123,456` - Neither 123 nor 456

### Dates

- just like Numbers but the parameter is passed to the Date constructor.

### String

- Basic
    - `string={all}match,batch` - Both match and batch must be present
    - `string={nin}match,batch` - Neither match nor batch
    - `string={in}match,batch` - Either match or batch
    - `string={ne}coffee` - Not coffee
- Regex
    - `string={in}{regex}^A,^B` - Starting either with A or B
    - `string={nin}{regex}^A,^B` - Starting neither with A or B
    - `string={in}{iregex}^A,^B` - Starting with A, B, a or b
- Text index searches
    - `$text=apple pear` - search on text index ( requires mongodb version >=2.4.6 )
    - `$text=apple pear,it` - search on text index in italian
    - `$text="some apples"` - search on text index whole phrase
    - `$text=pears -apples` - search on text index containing pears but no apples

### Boolean

- `t`, `y`, and `1` are all aliases for `true` anything else will be evaluated as `false`

### Array

- `array={all}match,batch` - Both match and batch must be present
- `array={nin}match,batch` - Neither match nor batch
- `array={in}match,batch` - Either match or batch
- `latlon={near}37,-122,5` - Near 37,-122, with a 5 max radius
- `latlon={near}37,-122` - Near 37,-122, no radius limit. Automatically sorts by distance

### Mixed

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
- `latlon={near}37,-122,5` - Near 37,-122, with a 5 max radius
- `latlon={near}37,-122` - Near 37,-122, no radius limit. Automatically sorts by distance

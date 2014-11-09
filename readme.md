# MONGOOSE-REF-QUERY

## Overview

- Provides a mongoose model method that transforms http request objects into mongo query expressions. e.g. `/monsters?name=joe&age={gt}20`
- Adds support for query expressions on referenced fields. e.g. `/employee?manager.manager.name=herkules`
- It can check that the query matches the schema and if not throw an error ( disabled by default ).

## Usage

Apply the plugin to any schema in the usual Mongoose fashion:

```
monsterSchema.plugin(mongooseRefQuery[, options]);
```

### options

|  option     | type    | default | description                                                  |
|-------------|---------|---------|--------------------------------------------------------------|
| throwErrors | Boolean | false   | will throw errors if the expression doesn't match the schema |
| debug       | Boolean | false   | will print debug info (the final mongo query)                |

### For the http interface

```
Monster.refQuery(req.query)()
```

returns a promise.

The refQuery call will throw an error if **throwErrors** is set in the options.

### For the advanced mongo query interface

```
// .refQueryPrepare(expression[, config])
var trigger = Employee.refQueryPrepare({ "manager.manager.name" : "herkules" });
var promise = trigger();
```

The refQueryPrepare throws an error if set in the options,
if not the invalid part of the expression will simply be ignored.

The config parameter is a query config object with the folowing options:

|  option  | type          | default | description                               |
|----------|---------------|---------|-------------------------------------------|
| ids_only | Boolean       | false   | will return only the \_id field           |
| per_page | Number        | 10      | max number of records returned            |
| page     | Number        | 1       | page number                               |
| sort     | Object        | false   | sorting parameter e.g. { field_name : -1 }|
| populate | Array:String  | []      | list of populated fields                  |

## Http interface syntax

see [http-interface](docs/http-interface.md)

## To run tests

See [dev](docs/dev.md)

## License

MIT [mit-license.org](http://mit-license.org/)

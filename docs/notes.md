
Structured expressions considerations
=====================================

Operators can be divided into two groups:

- require path - { fieldname : { $gt : 15 } }
    - comparison, element - ( $gt, $in, ... )
    - array ( $elemMatch, $size, $all )
    - evalutation - ( $regex, $mod, ... )
    - geospatial ( $near )
- don't require a path - { $or : [] }
    - logical - ( $or, $and, ... ) ( the path will be included in the included expression )
- are only on the top level of an expression for a document
    - exceptions ( $text, $where )

Any expression containing more than one property can be expressed through an expression with an $and property with
an array containing the single expressions.

{
    age : { $gt: 18 },
    name: { $regex: /^A/ }
}
=>
{ $and : [
    { age : { $gt : 18 } },
    { name : { $regex : /^A/ } }
] }

this is more generic since it is valid every time even when specifing criterias on same path or with same operator.

Following the above system, we get an expression tree where each object has one and only one attribute.


## Transformations

#### $and

{ prop1 : expr1, prop2 : expr2 } => { $and : [ { prop1 : expr1 }, { prop2 : expr2 } ] }

#### $elemMatch

{ $elemMatch : { prop1 : expr1, prop2 : expr2 } } => { $elemMatch : { $and : [ { prop1 : expr1 }, { prop2 : expr2 } ] } }

#### $in

In can't contain expressions only primitives ( number, string, regex )

{ $in : [ val1, val2 ] }



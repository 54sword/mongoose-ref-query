## The All operator

Each expression of the $all operator must be suttisfied by at least one element (it doesn't have to be the same element).
( NOT all the elements must suttisfy all the expressions )
To pass an expression (and not the entire element specification) you must wrap it into an $elemMatch expression ( see examples below ).

Can be used only on paths of type array ( not subpaths ).

// only people having both Kale and Beets in their foods array
{
  foods : { $all : [ 'Kale', 'Beets' ] }
}

#### Equivalent expressions

```
{
  foods: {
            $all : [
                {
                  $elemMatch: {
                    calories : { $gt: 20 },
                    name: { $regex : /^B/ }
                  }
                }
            ]
  }
}
```

is equivalent to

```
{
  $and : [
      { $elemMatch : {
          $and: [
          { "foods.calories" : { $gt: 20 } },
          { "foods.name" : { $regex : /^B/ } }
          ]
      }
  ]
}
```

?? **The all operator can/cannot always be replaced by an $and with longer paths.** ??

```
// invalid
{ foods : { $and : [
            { $elemMatch : { name: { $regex: /^T/ }, calories: 12 } },
            { $elemMatch : { name: { $regex: /^S/ }, calories: 5 } },
            ]
          }
}
// valid
{ $and : [
    { foods : { $elemMatch : { name: { $regex: /^T/ }, calories: 12 } } },
    { foods : { $elemMatch : { name: { $regex: /^S/ }, calories: 5 } } },
] }
```

```
// valid
{ foods: { $all : [
            { $elemMatch : { name: { $regex: /^T/ }, calories: 12 } },
            { $elemMatch : { name: { $regex: /^S/ }, calories: 5 } },
           ]
         }
}
```

The following throws "Can't canonicalize query: BadValue unknown top level operator: $elemMatch" ( the $elemMatch can be applied only to array paths )

## The elemMatch operator

The array must contain at least one element suddisfing all of the criterias.

```
{
  $elemMatch : {
      'foods.type' : 'vegetable',
      'calories' : { $lt : 20 }
  }
}
```

## The and operator

Is implicit when you specify multiple operators in a query, for example:

```
{
    age: { $gt: 18 },
    sex: "female"
}
```

is the same as

```
{
    $and: [
      { age: { $gt: 18 } },
      { sex: 'female' }
    ]
}
```

The and operator is mandatory when specifing multiple criterias on the same field \

```
{ $and: [ { price: { $ne: 1.99 } }, { price: { $exists: true } } ] }
```

which is can also be written as

```
{ price: { $ne: 1.99, $exists: true } }
```

, or with the same operator

```
{
    $and : [
        { $or : [ { price : 0.99 }, { price : 1.99 } ] },
        { $or : [ { sale : true }, { qty : { $lt : 20 } } ] }
    ]
}
```

## NOTES
- $size behaves like a comparison operator not an array one.
- the element operators should be avaiable on all types ( as long as the path exists or is mixed )
- $where and $text can be only on top of a query expression

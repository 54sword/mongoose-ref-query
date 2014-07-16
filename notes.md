
## Structured

Might want to be able to process any mongodb compliant query.

#### Operators to consider

Braching operators : $or, $and, $not, $nor

On mixed and arrays might consider : $exists, $type, 

$size does not accept ranges or further query expressions.

Geo operators.

$where ???

#### Complex one

```
{
    $and : [
        { $or : [ { price : 0.99 }, { price : 1.99 } ] },
        { $or : [ { sale : true }, { qty : { $lt : 20 } } ] }
    ]
}
```


```
let pass only people older than 18, joe and mag cant pass even if underage
{
    $or : {
        name: {
            $in: [ 'joe', 'mag' ]
        },
        age: {
            $gt : 18
        }
    }
}
```

#### Referenced

On references consider the $and, $or operators

let pass only people older than 18, joe and mag cant pass even if underage
name is a reference to a collection of names.

```
{
    $or : {
        name.first: {
            $in: [ 'joe', 'mag' ]
        },
        age: {
            $gt : 18
        }
    }
}
```

query flow :

```
/names -> {
    first : {
        $in : [ 'joe', 'mag' ]
    }
}

|
V

/people -> {
    $or : [
        {
            name : {
                $in : [<ids_from_query_above>]
            }
        },
        {
            $age : {
                $gt : 18
            }
        }
    ]
}
```

## The All operator

Each expression of the $all operator must be suttisfied by at least one element.
( NOT all the elements must suttisfy all the expressions )
To pass an expression (and not the entire element specification) you must wrap it into an $elemMatch expression ( see examples below ).

Can be used only on paths of type array ( not subpaths ).

// only people having both Kale and Beets in their foods array
{
  foods : { $all : [ 'Kale', 'Beets' ] }
}

#### On the dataset people.json

```
// doesn't work - returns empty result set
// ( searches for at least one element "{ calories: { $gt : 20 } }" literal matching not expression ) ( probably :D )
{
  foods : {
            $all : [
                { calories: { $gt : 20 } },
            ]
          }
} 

// this does work - returns ['Mark', 'Anna'] - $elemMatch is probably some kind of exception for the exact element match
{
  foods: {
            $all : [
                { $elemMatch: { calories : { $gt: 20 } } }
            ]
         }
}

// further restriction - returns ['Anna']
// must contain at least one element that has more than 20 calories and a name starting with B
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

// different restriction - returns ['Anna']
// must contain at least one element that has more than 20 calories and at least one element with a name starting with X
{
  foods: {
            $all : [
                {
                  $elemMatch: {
                    calories : { $gt: 20 }
                  }
                },
                {
                  $elemMatch: {
                    name: { $regex : /^X/ }
                  }
                }
            ]
  }
}
```

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

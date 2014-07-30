"use strict";

var Q = require("q");

var defaultOptions = {
    throwErrors: false
};

var defaultQueryConfig = {
    page : 1,
    per_page : 10,
    sort : false,
    populate : [],
    ids_only : false
};

module.exports = exports = function apiQueryPlugin (schema, opts) {
  var Types = schema.constructor.Types,
      options = extend({}, defaultOptions, opts);

  schema.statics.apiQuery = function(rawParams, cb) {
      var model = this,
          parsed;

      try {
          parsed = parseQuery(rawParams);
      } catch (e) {
          if (options.throwErrors )
              throw new Error("Invalid format of query: \n" + e.message);
          else {
              if ( cb )
                  setTimeout(function() { cb(e, null); });
              else
                  return { exec: function() { return Q.resolve([]); } };
          }
      }


      var query = model.apiQueryPrepare(parsed.mongo_expression, parsed.config);
      if ( cb )
          return query().then(function(result) { cb(null, result); }, function(reason) { cb(reason); }).done();
      else
          return { exec: query };
  };

  /**
   * Takes an abstract query tree and applies it to the schema - changes reference
   * expressions to $in promises and converts the arguments to the appropriate types.
   */
  schema.statics.apiQueryPrepare = function(expression, config) {

     var model = this,
         connection = model.db;

     config = extend({}, defaultQueryConfig, config || {} );

     var projection,
         queries = [],
         i;

     projection = evalExpression(this.schema, expression);

     function prepareDependencyQuery(model, projection_path, path, expression) {
         var reference_query = {};

         if ( path )
             reference_query[path] = expression;
         else
             reference_query = expression;

         console.log("\nREFERENCE_QUERY:");
         console.log(reference_query);
         var query = model.apiQueryPrepare(reference_query, {ids_only: true}),
             trigger = function() {
                 return query()
                 .then(function(ids) {
                     ids = ids.map(function(obj) { return obj._id; });
                     var ncond = {};
                     ncond[projection_path] = { $in: ids };
                     if (!projection.$and) projection.$and = [];
                     projection.$and.push(ncond);
                 });
             };
         queries.push(trigger);
     }

     function evalExpression(schema, expression) {
         var projection = {};

         function addStringExpression(path, expression) {
             projection[path] = expression;
         }

         var arr_operators = [
            "$in",
            "$nin",
            "$not",
            "$mod",
            "$near",
            "$all"
         ];

         function addNumberExpression(path, expression) {
             var p;
             if ( isObject(expression) ) {
                 p = {};
                 for ( var i in expression ) {
                     if ( ~arr_operators.indexOf(i) ) p[i] = expression[i].map(parseFloat);
                     else p[i] = parseFloat(expression[i]);
                 }
             } else {
                 p = parseFloat(expression);
             }
             projection[path] = p;
         }

         function addArrayExpression(path, expression) {
             var p = {};
             for ( var i in expression ) {
                 if ( i == "$near" || i == "$maxDistance" )
                     p[i] = expression[i];
                 else if ( ~arr_operators.indexOf(i) )
                     p[i] = expression[i].map(parseFloat);
                 else
                     p[i] = parseFloat(expression[i]);
             }
             projection[path] = p;
         }

         function addBooleanExpression(path, expression) {
             projection[path] = convertToBoolean( isObject(expression) ?
                                                  expression.$in[0] :
                                                  expression );
         }

         for ( var key in expression ) {
             var c_expression = expression[key];

             if ( ~["$and","$or"].indexOf(key) ) {
                 var projectionArray = projection[key] = [];
                 for ( var j  = 0, jj = c_expression.length; j < jj; j++ ) {
                     projectionArray.push( evalExpression(schema, c_expression[j]) );
                 }
             }
             else if ( key == "$text" ) {
                 projection[ key ] = c_expression;
             }
             else if ( key == "$elemMatch" ) {
                 projection[ key ] = evalExpression(schema, c_expression);
             }
             else {
                 // path
                 var path = key,
                     path_parts = key.split("."),
                     rest_of_path = path_parts.slice(),
                     c_schema = schema,
                     c_path, refd_model;
                 while (( c_path = rest_of_path.shift() )) {

                     if ( /^\d+$/.test(c_path) ) continue; // TODO should test if parent was array

                     if ( rest_of_path.length ) {
                         c_schema = c_schema.paths[c_path];
                         if ( ! c_schema ) {
                             if ( options.throwErrors ) throw new Error("invalid path");
                             return;
                         }
                         if ( c_schema.constructor === Types.Mixed ) {
                             // element is of type mixed
                             projection[ key ] = c_expression;
                             break;
                         }
                         if (( refd_model = isReference(c_schema) )) {
                             refd_model = connection.model(refd_model);
                             if ( /\d+/.test(rest_of_path[0]) )
                                 rest_of_path.shift();
                             prepareDependencyQuery( refd_model,
                                                     path_parts.slice(0,path_parts.length-rest_of_path.length).join("."),
                                                     rest_of_path.join("."),
                                                     c_expression);
                             break;
                         }
                         if ( ! isArray(c_schema) ) {
                             if ( options.throwErrors ) throw new Error("querying subpath of non-array/mixed/reference");
                             return;
                         }

                         c_schema = c_schema.schema;
                     }
                     else {
                         if ( c_schema === undefined ) {
                             // element of array of mixed
                             projection[ key ] = c_expression;
                             break;
                         }

                         // last element of path
                         c_schema = c_schema.paths[c_path];
                         if ( ! c_schema ) {
                             if ( options.throwErrors ) throw new Error("The given schema has no path \""+c_path+"\"!");
                             return;
                         }

                         if ( ( isObject(c_expression) ) &&
                              ~Object.keys(c_expression).indexOf("$size") ) {
                             projection[ key ] = { $size: c_expression.$size };
                             delete c_expression.$size;
                         }
                         if ( !isObject(c_expression) ||
                              Object.keys(c_expression).length ) {
                             switch ( c_schema.constructor ) {
                                 case Types.Boolean:
                                     addBooleanExpression(path, c_expression);
                                     break;
                                 case Types.String:
                                     addStringExpression(path, c_expression);
                                     break;
                                 case Types.Number:
                                     addNumberExpression(path, c_expression);
                                     break;
                                 case Types.Mixed:
                                     projection[ key ] = c_expression;
                                     break;
                                 case Types.Array:
                                 case Types.DocumentArray:
                                     if ( c_schema.schema ) {
                                         projection[ key ] = evalExpression(c_schema.schema, c_expression);
                                     }
                                     else if (( refd_model = isReference(c_schema) )) {
                                         refd_model = connection.model(refd_model);
                                         var divided = dotNotationToSingleQuery(c_expression);
                                         for ( var v = 0, vv = divided.length; v < vv ; v++ ) {
                                             prepareDependencyQuery(refd_model,
                                                                    path_parts.slice(0,path_parts.length-rest_of_path.length).join("."),
                                                                    "",
                                                                    divided[v]);
                                         }
                                         break;
                                     }
                                     else {
                                         switch ( c_schema.options.type[0] && Types[c_schema.options.type[0].name] ) {
                                             case Types.Boolean:
                                                 addBooleanExpression(path, c_expression);
                                                 break;
                                             case Types.String:
                                                 addStringExpression(path, c_expression);
                                                 break;
                                             case Types.Number:
                                                 addNumberExpression(path, c_expression);
                                                 break;
                                             case Types.Mixed:
                                                 projection[ key ] = c_expression;
                                                 break;
                                             case undefined:
                                                 addArrayExpression(path, c_expression);
                                                 break;
                                             default:
                                                 if ( options.throwErrors ) throw new Error("weird type");
                                                 return;
                                         }
                                     }
                                     break;
                                 default:
                                     if ( options.throwErrors ) throw new Error("Unsupported type");
                                     return;
                             }
                         }
                     }

                 }
             }
         }

         return projection;
     }

     return function() {
         var promises = queries.map(function(query) { return query(); });
         return Q.all(promises).then(function() {
             /* all the subqueries were resolved */

             // Create the Mongoose Query object.
             var query = model.find(projection, config.ids_only ? "_id" : undefined);

             ///* TODO don't forget to remove this
             console.log("\nquerying with: ");
             console.log( JSON.stringify(projection) );
             //*/

             for ( i = 0; i < config.populate.length; i++ ) {
               query = query.populate(config.populate[i]);
             }

             if ( config.ids_only ) query = query.lean();

             query = query.limit(config.per_page).skip((config.page - 1) * config.per_page);

             if (config.sort) query = query.sort(config.sort);

             return query.exec();
         });
     };
  };

  /**
  * Returns the type of the referred type ( truthy ) if reference, false otherwise.
  */
  function isReference(schema) {
    var refd_type;
    // simple reference
    if ((refd_type = schema.options.ref)) return refd_type;
    // array of references
    if ((refd_type = schema.options.type && schema.options.type[0] && schema.options.type[0].ref)) return refd_type;
    return false;
  }

  function isArray(schema) {
    if ( schema.constructor === Types.Array || schema.constructor === Types.DocumentArray )
        return true;
    else
        return false;
  }

};


/**
 * Because an expression on an array of references is transformed into
 * a top level query, we have to transform normal criterias to an $and
 * of queries and $elemMatch to a simple query expression.
 */
function dotNotationToSingleQuery(expression) {
    var conds = [];
    for ( var i in expression ) {
        if ( i === "$elemMatch" ) {
            conds.push(expression[i]);
        }
        else {
            var n = {};
            n[i] = expression[i];
            conds.push(n);
        }
    }
    return conds;
}

/**
 * Expects a http GET params object and returns an expression with an $and operator at its root.
 */
var parseQuery = exports.__parseQuery = function(o) {
    var query = {
        mongo_expression : { $and: [] },
        config : {
            page : 1,
            per_page : 10,
            sort : false,
            populate : [],
            ids_only : false
        }
    };

    for ( var i in o ) {
        switch (i) {
            case "page":
            case "per_page":
                query.config[i] = parseInt(o[i]);
                break;
            case "sort_by":
                if ( ! query.config.sort ) query.config.sort = {};
                var p = o[i].split(",");
                query.config.sort[p[0]] = p[1] || 1;
                break;
            case "populate":
                query.config.populate = o[i].split(",");
                break;
            case "$text":
                var args = parsedSplit(",", o[i]),
                    text_search = { $text: { $search : args[0] } };
                if ( args.length > 1 )
                    text_search.$text.$language = args[1];
                query.mongo_expression.$and.push( text_search );
                break;
            default:
                var parsedConditions = parseValue( o[i] );
                for ( var j = 0, jj = parsedConditions.length; j < jj ; j++ ) {
                    var condition = {};
                    condition[i] = parsedConditions[j];
                    query.mongo_expression.$and.push( condition );
                }
        }
    }

    if ( ! query.mongo_expression.$and.length )
        query.mongo_expression = {};

    return query;
};

/* primary operators that delimit criterias */
var p_operators = [
"gt",
"gte",
"lt",
"lte",
"ne",
"nin",
"in",
"eq",
"mod",
"near",
"size",
"text",
"all"
];

/* avaiable secondary operators that modify
 * how the arguments are handled */
var s_operators = [
"regex",
"iregex",
"null"
];

/* operators that take an array as argument ( this is not the mongo arity, but the http interface one ) */
var array_operators = [
"in",
"nin",
"mod",
"near",
"all"
];

/**
 * Expects a value of a http get parameter and returns a list of criterias in the form { operators : [...], args : [...] }.
 */
var parseValue = function (str) {
    var conditions = [], c_condition,
        i = 0, ii = str.length,
        buffer = "",
        in_operator = false, escaped = false; // state machine flags

    function newCondition() {
        genCondition();
        c_condition = { operators: [], args: [] };
    }

    function genCondition() {
        if ( ! c_condition ) return;
        var c = {},
            op = c_condition.operators.length ? c_condition.operators[0] : "in",
            regex = ~c_condition.operators.indexOf("regex"),
            args = c_condition.args,
            caseInsensitive;

        op = ( op === null ) ? "in" : op;

        if ( !args.length )
            args.push( ~c_condition.operators.indexOf("null") ? null : "" );

        if ( ~c_condition.operators.indexOf("iregex") ) {
            regex = true;
            caseInsensitive = true;
        }

        args = regex ? args.map(function(str) { return new RegExp(str, caseInsensitive ? "i" : undefined); }) : args;
        args = ~array_operators.indexOf(op) ? args : args[0];

        if ( op == "near" ) {
            args = args.map(function(str) { return parseFloat(str); });
            c.$near = args.slice(0,2);
            if ( args.length > 2 )
                c.$maxDistance = args[2];
        }
        else  {
            c["$"+op] = args;
        }

        conditions.push(c);
    }

    function pushOperator(name) {
        if ( ! c_condition ) newCondition();
        if ( ! ~p_operators.indexOf(name) && ! c_condition.operators.length )
            c_condition.operators.push( null );
        if ( c_condition.operators.length && ! ~s_operators.indexOf(name) )
            throw new Error("Invalid secondary operator \""+ name + "\"!");
        c_condition.operators.push( name );
    }

    function pushArg(val) {
        if ( ! c_condition ) newCondition();
        c_condition.args.push( val );
    }

    while ( i < ii ) {
        if ( in_operator ) {
            if ( str[i] === "}" ) {
                if ( ~p_operators.indexOf(buffer) ||              // is primary operator
                     ( c_condition && c_condition.args.length ) ) // following argument
                    newCondition();
                pushOperator( buffer );
                in_operator = false;
                buffer = "";
            } else {
                buffer += str[i];
            }
        }
        else {
            if ( escaped ) {
                if ( ! ~["{","\\",","].indexOf(str[i]) )
                    throw new Error("Invalid escape sequence '\\" + str[i] + "'");
                buffer += str[i];
                escaped = false;
            }
            else {
                switch ( str[i] ) {
                    case "{":
                        if ( buffer.length ) {
                            pushArg( buffer );
                            buffer = "";
                        }
                        in_operator = true;
                        break;
                    case ",":
                        if ( buffer.length ) {
                            pushArg( buffer );
                            buffer = "";
                        }
                        else
                            throw new Error("Argument list starting with comma!");
                        break;
                    case "}":
                        throw new Error("Invalid character '}'");
                    case "\\":
                        escaped = true;
                        break;
                    default:
                        buffer += str[i];
                }
            }
        }
        i++;
    }
    if ( in_operator )
        throw new Error("Reached end of string inside operator!");
    if ( escaped )
        throw new Error("Escaped end of string!");

    if ( buffer.length )
        pushArg( buffer );

    genCondition();

    return conditions;
};

/**
 * Splits a string by delimiter allowing the use of
 * backslash for escaping it.
 * e.g. parsedSplit(",","fir\\,st,second") => ["fir,st","second"]
 */
function parsedSplit(delimiter, text) {
    var parts = [], i, ii, c, buff = "", escaped = false;
    for (i = 0, ii = text.length; i < ii ; i++) {
        c = text[i];
        if ( escaped ) {
            if ( c != delimiter && c != "\\" )
                throw new Error("Invalid escape character!");
            buff += c;
            escaped = false;
        }
        else if ( c == "\\" )
            escaped = true;
        else if ( c == delimiter ) {
            parts.push(buff);
            buff = "";
        }
        else
            buff += c;
    }
    if ( escaped ) throw Error("End of string after backslash!");
    parts.push(buff);
    return parts;
}

function convertToBoolean(str) {
  str = str.toLowerCase();
  switch (str) {
      case "true":
      case "t":
      case "yes":
      case "y":
      case "1":
        return true;
      default:
        return false;
  }
}

function extend(a) {
    Array.prototype.slice.call(arguments, 1).forEach(function(b) {
        for ( var i in b ) {
            a[i] = b[i];
        }
    });
    return a;
}

/**
 * Recognizes regexps as NOT objects.
 */
function isObject(el) {
    return Object.prototype.toString.call(el) === "[object Object]";
}

"use strict";

var Q = require("q");

var functions = require("./functions"),
    parseDate = functions.parseDate,
    convertToBoolean = functions.convertToBoolean,
    extend = functions.extend,
    isObject = functions.isObject,
    getId = functions.getId,
    noop = functions.noop,
    prop = functions.prop,
    isReference = functions.isReference,
    isArray = functions.isArray,
    getPathToThisPoint = functions.getPathToThisPoint;

var parsing = require("./parsing"),
    parseQuery = parsing.parseQuery;

var defaultOptions = {
    throwErrors: true,
    debug: false,
    backreferences: {}
};

var defaultQueryConfig = {
    page : 1,
    per_page : 10,
    sort : false,
    populate : [],
    ids_only : false
};

function refQueryPlugin (schema, opts) {
  var Types = schema.constructor.Types,
      options = extend({}, defaultOptions, opts),
      LOG = noop;

  if (options.debug===true)
      LOG = console.log;
  if (!options.debug)
      LOG = noop;

  schema.statics.refQuery = function(rawParams) {
      var model = this, parsed;

      // may throw error
      parsed = parseQuery(rawParams);

      return model.refQueryPrepare(parsed.mongo_expression, parsed.config);
  };

  /**
   * Takes an abstract query tree and applies it to the schema - changes reference
   * expressions to $in promises and converts the arguments to the appropriate types.
   */
  schema.statics.refQueryPrepare = function(expression, config) {

     var model = this,
         connection = model.db;

     config = extend({}, defaultQueryConfig, config || {} );

     var projection,
         queries = [],
         i;

     projection = evalExpression(this.schema, expression);

     /**
      * Reference handler
      */
     function prepareDependencyQuery(model, projection_path, path, expression) {
         var reference_query;

         if ( path ) {
             reference_query = Object.create(null);
             reference_query[path] = expression;
         }
         else {
             reference_query = expression;
         }

         LOG("\nREFERENCE_QUERY:");
         LOG(reference_query);

         var query = model.refQueryPrepare(reference_query, { ids_only: true, per_page: 0, page: 1 });

         queries.push(function trigger() {
             return query()
             .then(function(result) {
                 var ids = result.data.map(getId);

                 var new_condition = Object.create(null);
                 new_condition[projection_path] = { $in: ids };

                 if (!projection.$and)
                     projection.$and = [];
                 projection.$and.push(new_condition);
             });
         });
     }

     /**
      * Backreference handler
      */
     function prepareDependencyQueryBR(model, path, expression, referencingProp) {
         path = path || "_id";

         var reference_query = {};
         reference_query[path] = expression;

         LOG("\nBackREFERENCE_QUERY :");
         LOG(reference_query);

         var query = model.refQueryPrepare(reference_query, { per_page: 0, page: 1 });

         queries.push(function trigger() {
             return query()
             .then(function(results) {
                 var ids = results.data.map(prop(referencingProp));

                 var new_condition = Object.create(null);
                 new_condition._id = { $in: ids };

                 if (!projection.$and)
                     projection.$and = [];
                 projection.$and.push(new_condition);
             });
         });
     }

     /**
      * returns object on success, undefined on error if throwErrors is false
      */
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

         function addDateExpression(path, expression) {
             var p;
             if ( isObject(expression) ) {
                 p = {};
                 for ( var i in expression ) {
                     if ( ~arr_operators.indexOf(i) ) p[i] = expression[i].map(parseDate);
                     else p[i] = parseDate(expression[i]);
                 }
             } else {
                 p = parseDate(expression);
             }
             projection[path] = p;
         }

         for ( var key in expression ) {
             var c_expression = expression[key];

             if ( ~["$and","$or"].indexOf(key) ) {
                 var projectionArray = projection[key] = [];
                 for ( var j  = 0, jj = c_expression.length; j < jj; j++ ) {
                     var evalued = evalExpression(schema, c_expression[j]);
                     if ( evalued && Object.keys(evalued).length )
                         projectionArray.push( evalued );
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
                     c_path, refd_model, backref;


                 while (( c_path = rest_of_path.shift() )) {

                     if ( /^\d+$/.test(c_path) ) continue; // TODO should test if parent was array

                     if (( backref = options.backreferences[getPathToThisPoint(path_parts, rest_of_path)] )) {
                         refd_model = connection.model(backref.model);
                         if ( /\d+/.test(rest_of_path[0]) )
                             rest_of_path.shift();
                         prepareDependencyQueryBR( refd_model,
                                                   rest_of_path.join("."),
                                                   c_expression,
                                                   backref.property );
                         break;
                     }

                     if ( rest_of_path.length ) {

                         if (!(c_schema = c_schema.paths[c_path])) {
                             if ( options.throwErrors ) throw new Error("invalid path: \"" + c_path + "\"");
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
                                                     getPathToThisPoint(path_parts, rest_of_path),
                                                     rest_of_path.join("."),
                                                     c_expression);
                             break;
                         }
                         if (!isArray(Types, c_schema)) {
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
                                 case Types.ObjectId:
                                     addStringExpression(path, c_expression);
                                     break;
                                 case Types.Number:
                                     addNumberExpression(path, c_expression);
                                     break;
                                 case Types.Date:
                                     addDateExpression(path, c_expression);
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
             var query = model.find(projection, config.ids_only ? "_id" : undefined),
                 count_query = model.find(projection).count();

             LOG("\nquerying with: ");
             LOG(JSON.stringify(projection));

             for (i = 0; i < config.populate.length; i++)
                 query = query.populate(config.populate[i]);

             if (config.ids_only)
                 query = query.lean();

             if (config.per_page !== 0)
                 query = query.limit(config.per_page).skip((config.page - 1) * config.per_page);

             if (config.sort)
                 query = query.sort(config.sort);

             var d = Q.defer();
             query.exec(function(err, result) {
                if (err) return d.reject(err);
                count_query.exec(function(err, count) {
                    if (err) return d.reject(err);
                    d.resolve({
                        count: count,
                        data: result
                    });
                });
             });
             return d.promise;
         });
     };
  };

}

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

module.exports = refQueryPlugin;
module.exports.__parseQuery = parseQuery;

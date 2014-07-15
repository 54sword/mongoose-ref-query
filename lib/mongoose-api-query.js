
var defaultOptions = {
    throwErrors: true
};

module.exports = exports = function apiQueryPlugin (schema, ops) {

  var Types = schema.constructor.Types,
      options = simpleExtend({}, defaultOptions, ops);

  schema.statics.apiQuery = function(rawParams, cb, ids_only) {
      var model = this,
          parsed;

      try {
          parsed = parseQuery(rawParams);
      } catch (e) {
          if (options.throwErrors )
              throw new Error("Invalid format of query: \n" + e.message);
          else {
              if ( cb )
                  cb(e, null);
              else
                  // maybe should return a query that always resolves to empty array ?
                  return null;
          }
      }

      return model.apiQueryParsed(parsed, cb, ids_only);
  };

  schema.statics.apiQueryParsed = function(parsedParams, cb, ids_only) {
    var model = this,
        params = model.apiQueryParams(parsedParams);

    // Create the Mongoose Query object.
    query = model.find(params.searchParams, ids_only ? '_id' : undefined);

    /* TODO don't forget to remove this
    console.log("querying with: ");
    console.dir( params.searchParams );
    */
    
    for (var i = 0; i < params.populate.length; i++) {
      query = query.populate(params.populate[i]);
    }

    if ( ids_only ) query = query.lean();
    
    query = query.limit(params.per_page).skip((params.page - 1) * params.per_page);

    if (params.sort) query = query.sort(params.sort);

    if (cb) {
      query.exec(cb);
    } else {
      return query;
    }

  };

  schema.statics.apiQueryParams = function(parsedParams) {

    var model = this;

    var searchParams = {},
        query,
        page = 1,
        per_page = 10,
        sort = false,
        populate = [];

    var parseSchemaForKey = function (schema, keyPrefix, lcKey, criteria) {

      // default operator
      if ( ! criteria.operators.length )
          criteria.operators.push( null );

      if ( typeof schema === "undefined" ) {
          addMixed();
          return;
      }

      if ((matches = lcKey.match(/(.+?)\.(.+)/))) {

          // index in dot notation
          // ie. foods.1.amount=2 -> matches only if the second element of foods has amount set to 2
          if ( /\d+/.test( matches[1] ) ) {
                parseSchemaForKey(schema, keyPrefix + matches[1] + ".", matches[2], criteria);
                return;
          }

          // with key "a.b.c.d" it will get the schema of a
          var subschema = schema.paths[matches[1]];

          if ( ! subschema ) {
              if ( options.throwErrors )
                  throw new Error("the given schema has no path \"" + lcKey + "\" , prefix: \"" + keyPrefix + "\"");
              return;
          }

          if ( subschema.constructor === Types.Array ||          // array of typeschemas ( including mixed /ofMixed.secret=x )
               subschema.constructor === Types.Mixed ||          // subproperty of mixed /mixed.secret=x
               subschema.constructor === Types.DocumentArray ||  // subschemas
               subschema.options.ref ) {                         // single reference

              var refd_type;
              if ( (refd_type = subschema.options.ref) ||                                                                 // reference
                   (refd_type = subschema.options.type && subschema.options.type[0] && subschema.options.type[0].ref) ) { // array of refs

                  if ( options.throwErrors )
                      throw new Error("References are not implemented yet!");
                  return;

                  /*
                  var refd_model = mongoose.model( refd_type );

                  // TODO parse criteria
                  var subquery = {};
                  subquery[matches[2]] = "{"+operator+"}"+val;

                  refd_model.apiQuery(subquery, undefined, true).exec().then();
                  */

              }
              else {
                  // subschema.schema will return based on subschema
                  //  - typeschema for Array
                  //  - schema for DocumentArray
                  //  - undefined for Mixed or Array of Mixed ( /mixed.secret=x and /ofMixed.secret=x )
                  //    or empty array in schema definition ( mems: [], mems.location will be treated as mixed )
                  parseSchemaForKey(subschema.schema, keyPrefix + matches[1] + ".", matches[2], criteria);
              }
              return;

          }
          else {
              if ( options.throwErrors )
                  throw new Error("the path " + matches[1] + " is not an Array/Mixed schema thus you cannot query it's subpaths!");
              return;
          }
      }

      // lcKey will be "" if a typed array's element is being matched
      if ( lcKey && typeof schema.paths[lcKey] === "undefined"){
        if ( options.throwErrors )
            throw new Error("the given schema has no path \"" + lcKey + "\"");
        return;
      }

      var pathtype = lcKey ? schema.paths[lcKey].constructor : schema;
      if ( pathtype === Types.ObjectId ) {
          addSearchParam(val);
      } else if ( pathtype === Types.Boolean ) {
          addBoolean();
      } else if ( pathtype === Types.String ) {
          addString();
      } else if ( pathtype === Types.Number ) {
          addNumber();
      } else if ( pathtype === Types.Mixed ) {
          addMixed();
      } else if ( pathtype === Types.Array ) {
          var elementsType;
          if (( elementsType = schema.paths[lcKey].options.type[0] ))
              parseSchemaForKey( schema.paths[lcKey].schema || Types[elementsType.name] , keyPrefix + lcKey, '', criteria);
          else
              addArray();
      } else {
          // unsupported schematype
          if ( options.throwErrors )
              throw new Error("You cannot search by keys of schemaType \"" + pathtype.name + "\"");
      }
      return;

      function addBoolean() {
          addSearchParam(convertToBoolean(criteria.args[0]));
      }

      function addNumber() {
          var newParam;
          criteria.args = criteria.args.map(function(s) { return Number(s); });
          var operator = criteria.operators[0];
          switch ( operator ) {
              case "gt":
              case "gte":
              case "lt":
              case "lte":
              case "ne":
                  newParam = {};
                  newParam["$" + operator] = criteria.args[0];
                  addSearchParam(newParam);
                  break;
              case "in":
              case "nin":
                  newParam = {};
                  newParam['$'+operator] = criteria.args;
                  addSearchParam(newParam);
                  break;
              case "mod":
                  if ( criteria.args.length !== 2 ) {
                      if ( options.throwErrors )
                          throw new Error("operator mod accepts two arguments " + criteria.args.length + " given");
                      return;
                  }
                  addSearchParam({$mod: criteria.args});
                  break;
              case "eq":
              case null:
                  addSearchParam({$in: criteria.args});
                  break;
              default:
                  if ( options.throwErrors )
                      throw new Error("unsupported operator \"" + operator + "\"");
                  return;
          }
      }
      
      function addString() {
          var operator = criteria.operators[0] || null,
              ci = ~criteria.operators.indexOf('iregex'); // case insensitive
              regex = ci || ~criteria.operators.indexOf('regex');

          if ( regex )
              criteria.args = criteria.args.map(function(s) { return new RegExp( s, ci ? 'i' : undefined ); });

          switch ( operator ) {
              case "ne":
                  addSearchParam({'$ne': criteria.args[0]});
                  break;
              case "not":
                  addSearchParam({'$not': criteria.args[0]});
                  break;
              case "nin":
              case "in":
                  newParam = {};
                  newParam["$" + operator] = criteria.args;
                  addSearchParam(newParam);
                  break;
              case "eq":
              case null:
                  addSearchParam({$in: criteria.args });
                  break;
              default:
                  if ( options.throwErrors )
                      throw new Error("unsupported operator \"" + operator + "\"");
                  return;
          }
      }

      function addNear() {
        // divide by 69 to convert miles to degrees
        if ( criteria.args.length !== 2 && criteria.args.length !== 3 ) {
            if ( options.throwErrors )
                throw new Error("Invalid number of arguments for operator \"near\"");
            return;
        }
        var distObj = {$near: [parseFloat(criteria.args[0]), parseFloat(criteria.args[1])]};
        if ( criteria.args.length === 3 )
            distObj.$maxDistance = parseFloat(criteria.args[2]) / 69; // TODO make configurable units
        addSearchParam(distObj);
      }

      // only for untyped arrays
      function addArray() {
        var operator = criteria.operators[0];
        switch ( operator ) {
            case "all":
            case "in":
            case "nin":
                var newParam = {};
                newParam["$"+operator] = criteria.args;
                addSearchParam(newParam);
                return;
            case "near":
                addNear();
                return;
            case null:
                addSearchParam({ $in : criteria.args });
                return;
            default:
                if ( options.throwErrors )
                    throw new Error("given operator currently not supported with scheme array");
                return;
        }
      }

      function addMixed() {
          // as soon as we encounter a mixed schematype we add the whole query path
          // without traversing a subtree trying to use any mongo operator
          // thus this is a combination of all the other add<SchemaType>() functions
          var operator = criteria.operators[0];
          switch ( operator ) {
              case "gt":
              case "gte":
              case "lt":
              case "lte":
              case "ne":
              case "not":
                  newParam = {};
                  newParam["$" + operator] = criteria.args[0];
                  addSearchParam(newParam);
                  break;
              case "all":
              case "nin":
              case "in":
                  newParam = {};
                  newParam['$'+operator] = criteria.args;
                  addSearchParam(newParam);
                  break;
              case "mod":
                  if ( criteria.args.length !== 2 ) {
                      if ( options.throwErrors )
                          throw new Error("operator mod accepts two arguments " + criteria.args.length + " given");
                      return;
                  }
                  addSearchParam({$mod: criteria.args});
                  break;
              case "near":
                  addNear();
                  break;
              case "eq":
              case null:
                  addSearchParam({$in: criteria.args});
                  break;
              default:
                  if ( options.throwErrors )
                      throw new Error("unsupported operator \"" + operator + "\"");
                  return;
          }
      }

      function addSearchParam(val) {
          var key = keyPrefix + lcKey;

          if (typeof searchParams[key] !== 'undefined') {
            for (var i in val) {
              searchParams[key][i] = val[i];
            }
          }
          else {
            searchParams[key] = val;
          }
      }

    };

    var parseParam = function (key, criteria) {

      switch ( key ) {
        case "page":
            page = criteria.args[0];
            break;
        case "per_page":
            per_page = criteria.args[0];
            break;
        case "sort_by":
            if ( ! sort ) sort = {};
            sort[criteria.args[0]] = criteria.args[1] || 1;
            break;
        case "populate":
            populate = criteria.args;
            break;
        default:
            parseSchemaForKey(model.schema, "", key, criteria);
      }

    };

    // Construct searchParams
    for (var field_name in parsedParams) {
        var field_criterias = parsedParams[ field_name ];
        for (var i = 0, ii = field_criterias.length; i < ii ; ++i) {
          parseParam(field_name, field_criterias[i]);
        }
    }

    return {
      searchParams:searchParams,
      page:page,
      per_page:per_page,
      sort:sort,
      populate:populate
    };

  };

};

function convertToBoolean(str) {
  if (str.toLowerCase() === "true" ||
      str.toLowerCase() === "t" ||
      str.toLowerCase() === "yes" ||
      str.toLowerCase() === "y" ||
      str === "1") {
    return true;
  } else {
    return false;
  }
}

function simpleExtend(a, b) {
    for ( var i in b ) {
        a[i] = b[i];
    }
    return a;
}

var parseQuery = exports.__parseQuery = function(o) {
    var parsed = {};
    for ( var i in o ) {
        parsed[i] = parseValue( o[i] );
    }
    return parsed;
};
    
/* primary operators that delimit criterias */
var p_operators = [
"gt",
"gte",
"lt",
"lte",
"ne",
"not",
"nin",
"in",
"eq",
"mod",
"near",
];

var parseValue = function (str) {
    var conditions = [], c_condition,
        i = 0, ii = str.length,
        buffer = "",
        in_operator = false, escaped = false; // state machine flags

    function newCondition() {
        conditions.push( c_condition = { operators: [], args: [] } );
    }

    function pushOperator(name) {
        if ( ! c_condition ) newCondition();
        if ( ! ~p_operators.indexOf(name) && ! c_condition.operators.length )
            c_condition.operators.push( null );
        c_condition.operators.push( name );
    }

    function pushArg(val) {
        if ( ! c_condition ) newCondition();
        c_condition.args.push( val );
    }

    while ( i < ii ) {
        if ( in_operator ) {
            if ( str[i] === '}' ) {
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
                if ( ! ~['{','\\',','].indexOf(str[i]) )
                    throw new Error("Invalid escape sequence '\\" + str[i] + "'");
                buffer += str[i];
                escaped = false;
            }
            else {
                switch ( str[i] ) {
                    case '{':
                        if ( buffer.length ) {
                            pushArg( buffer );
                            buffer = "";
                        }
                        in_operator = true;
                        break;
                    case ',':
                        if ( buffer.length ) {
                            pushArg( buffer );
                            buffer = "";
                        }
                        else
                            throw new Error("Argument list starting with comma!");
                        break;
                    case '}':
                        throw new Error("Invalid character '}'");
                    case '\\':
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

    return conditions;
};

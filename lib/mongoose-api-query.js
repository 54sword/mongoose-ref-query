
var defaultOptions = {
    throwErrors: true
};

module.exports = exports = function apiQueryPlugin (schema, ops) {

  var Types = schema.constructor.Types,
      options = simpleExtend({}, defaultOptions, ops);

  schema.statics.apiQuery = function(rawParams, cb, fields) {
    var model = this,
        params = model.apiQueryParams(rawParams);
    // Create the Mongoose Query object.
    query = model.find(params.searchParams, fields);
    
    for (var i = 0; i < params.populate.length; i++) {
      query = query.populate(params.populate[i]);
    }
    
    query = query.limit(params.per_page).skip((params.page - 1) * params.per_page);

    if (params.sort) query = query.sort(params.sort);

    if (cb) {
      query.exec(cb);
    } else {
      return query;
    }
  };

  schema.statics.apiQueryParams = function(rawParams) {

    var model = this;

    var searchParams = {},
        query,
        page = 1,
        per_page = 10,
        sort = false,
        populate = [];

    var parseSchemaForKey = function (schema, keyPrefix, lcKey, val, operator) {

      var paramType = false;

      if ( typeof schema === "undefined" ) {
          addMixed();
          return;
      }

      if ((matches = lcKey.match(/(.+?)\.(.+)/))) {

          // index in dot notation
          // ie. foods.1.amount=2 -> matches only if the second element of foods has amount set to 2
          if ( /\d+/.test( matches[1] ) ) {
                parseSchemaForKey(schema, keyPrefix + matches[1] + ".", matches[2], val, operator);
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

              if ( subschema.options.ref ||                                                                 // reference
                   subschema.options.type && subschema.options.type[0] && subschema.options.type[0].ref ) { // array of refs
                  if ( options.throwErrors )
                      throw new Error("References are not implemented yet!");
              }
              else {
                  // subschema.schema will return based on subschema
                  //  - typeschema for Array
                  //  - schema for DocumentArray
                  //  - undefined for Mixed or Array of Mixed ( /mixed.secret=x and /ofMixed.secret=x )
                  //    or empty array in schema definition ( mems: [], mems.location will be treated as mixed )
                  parseSchemaForKey(subschema.schema, keyPrefix + matches[1] + ".", matches[2], val, operator);
              }
              return;

          }
          else {
              if ( options.throwErrors )
                  throw new Error("the path " + matches[1] + " is not an Array/Mixed schema thus you cannot query it's subpaths!");
              return;
          }
      }

      if (typeof schema.paths[lcKey] === "undefined"){
        if ( options.throwErrors )
            throw new Error("the given schema has no path \"" + lcKey + "\"");
        return;
      }

      var pathtype = schema.paths[lcKey].constructor;
      if ( pathtype === Types.ObjectId ) {
          addSearchParam(val);
      } else if ( pathtype === Types.Boolean ) {
          addBoolean();
      } else if ( pathtype === Types.String ) {
          addString();
      } else if ( pathtype === Types.Number ) {
          addNumber();
      } else if ( pathtype === Types.Array ) {
          addArray();
      } else if ( pathtype === Types.Mixed ) {
          addMixed();
      } else {
          // unsupported schematype
          if ( options.throwErrors )
              throw new Error("You cannot search by keys of schemaType \"" + pathtype.name + "\"");
      }
      return;

      function addBoolean() {
          addSearchParam(convertToBoolean(val));
      }

      function addNumber() {
          var newParam;

          switch ( operator ) {
              case "gt":
              case "gte":
              case "lt":
              case "lte":
              case "ne":
                  newParam = {};
                  newParam["$" + operator] = val;
                  addSearchParam(newParam);
                  break;
              case "all":
              case "in":
              case "nin":
                  newParam = {};
                  newParam['$'+operator] = val.split(',');
                  addSearchParam(newParam);
                  break;
              case "mod":
                  newParam = val.split(',');
                  if ( newParam.length !== 2 ) {
                      if ( options.throwErrors )
                          throw new Error("operator mod accepts two arguments " + newParam.length + " given");
                      return;
                  }
                  addSearchParam({$mod: [newParam[0], newParam[1]]});
                  break;
              case null:
                  // TODO write tests for this
                  newParam = val.split(',');
                  if ( newParam.length > 1 )
                      addSearchParam({$in: newParam});
                  else
                      addSearchParam(val);
                  break;
              default:
                  if ( options.throwErrors )
                      throw new Error("unsupported operator \"" + operator + "\"");
                  return;
          }
      }
      
      function addString() {
          switch ( operator ) {
              case "exact":
                  addSearchParam(val);
                  break;
              case "ne":
              case "not":
                  var neregex = new RegExp(val,"i");
                  addSearchParam({'$not': neregex});
                  break;
              case "all":
              case "nin":
              case "in":
                  newParam = {};
                  newParam["$" + operator] = val.split(',').map(function(str) {
                      return new RegExp(str, 'i');
                  });
                  addSearchParam(newParam);
                  break;
              case null:
                  newParam = val.split(',');
                  if ( newParam.length > 1 ) {
                      newParam = newParam.map(function(str) {
                          return new RegExp(str, 'i');
                      });
                      addSearchParam({$in: newParam});
                  }
                  else
                      addSearchParam({$regex: val, $options: "-i"});
                  break;
              default:
                  if ( options.throwErrors )
                      throw new Error("unsupported operator \"" + operator + "\"");
                  return;
          }
      }

      function addNear() {
        // divide by 69 to convert miles to degrees
        var latlng = val.split(',');
        var distObj = {$near: [parseFloat(latlng[0]), parseFloat(latlng[1])]};
        if (typeof latlng[2] !== 'undefined') {
          distObj.$maxDistance = parseFloat(latlng[2]) / 69;
        }
        addSearchParam(distObj);
      }

      function addArray() {
        switch ( operator ) {
            case "all":
            case "in":
            case "nin":
                var newParam = {};
                newParam["$"+operator] = val.split(',');
                addSearchParam(newParam);
                return;
            case "near":
                addNear();
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
          switch ( operator ) {
              case "gt":
              case "gte":
              case "lt":
              case "lte":
              case "ne":
              case "not":
                  newParam = {};
                  newParam["$" + operator] = val;
                  addSearchParam(newParam);
                  break;
              case "all":
              case "nin":
              case "in":
                  newParam = {};
                  newParam['$'+operator] = val.split(',');
                  addSearchParam(newParam);
                  break;
              case "mod":
                  newParam = val.split(',');
                  if ( newParam.length !== 2 ) {
                      if ( options.throwErrors )
                          throw new Error("operator mod accepts two arguments " + newParam.length + " given");
                      return;
                  }
                  addSearchParam({$mod: [newParam[0], newParam[1]]});
                  break;
              case "near":
                  addNear();
                  break;
              case null:
                  newParam = val.split(',');
                  if ( newParam.length > 1 )
                      addSearchParam({$in: newParam});
                  else
                      addSearchParam({$regex: val, $options: "-i"});
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
            console.log('added ' + key + ' = ' );
            console.dir( val );
          }
      }

    };

    var parseParam = function (key, val) {

      var operator = val.match(/\{(.+?)\}/);
      val = val.replace(/\{(.+?)\}/, '');
      if (operator) operator = operator[1];

      switch ( key ) {
        case "page":
            page = val;
            break;
        case "per_page":
            per_page = val;
            break;
        case "sort_by":
            var parts = val.split(',');
            sort = {};
            sort[parts[0]] = parts.length > 1 ? parts[1] : 1;
            break;
        case "populate":
            populate = val.split(',');
            break;
        default:
            if (val === "") return;
            parseSchemaForKey(model.schema, "", key, val, operator);
      }

    };

    // Construct searchParams
    for (var key in rawParams) {
      // handles multiple operators "age={gt}18{lt}30" => "age={gt}18&age={lt}30"
      var separatedParams = rawParams[key].match(/\{\w+?\}[^\{]+/g);

      if (separatedParams === null) {
        parseParam(key, rawParams[key]);
      } else {
        for (var i = 0, len = separatedParams.length; i < len; ++i) {
          parseParam(key, separatedParams[i]);
        }
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
      str === "1"){
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

var expect = require("expect.js"),
    request = require("request");

describe('basic functionality', function(){

  // without any query params, loads all monsters
  testPath("/monster", 6, isOfNumber);

  // does string searching
  testPath("/monster?name=Big Purple People Eater", "Big Purple People Eater", hasMonster);

  /* it ignores them only is set in the options 
  // ignores unmatched params
  testPath("/monster?coffee=black", 6, isOfNumber);
  */

  // can't use exact matching with other operators ( should return error )
  testPath("/monster?monster_identification_no={in}1{lt}20", "Big Purple People Eater", hasMonster);

  // can sort results
  testPath("/monster?sort_by=monster_identification_no,-1", ["Bessie the Lochness Monster", "Big Purple People Eater"], inOrder);

  // can sort results on nested params
  testPath("/monster?sort_by=foods.name,1", ["Big Purple People Eater", "Biggie Smalls the 2nd"], inOrder);

  // default sort order is asc
  testPath("/monster?sort_by=foods.name", ["Big Purple People Eater", "Biggie Smalls the 2nd"], inOrder);

  // "desc" is valid sort order
  testPath("/monster?sort_by=monster_identification_no,desc", ["Biggie Smalls the 2nd", "Big Purple People Eater"], inOrder);


  // works with {near} and no stated radius
  testPath("/monster?loc={near}38.8977,-77.0366", 6, isOfNumber);

  // returns correct result for {near} within 1 mile radius
  testPath("/monster?loc={near}38.8977,-77.0366,1", ["Big Purple People Eater"], containsMonsters);

  // returns correct result for {near} within 3 mile radius
  testPath("/monster?loc={near}38.8977,-77.0366,3", [ "Big Purple People Eater", "Biggie Smalls", "Frankenstein", "Biggie Smalls the 2nd" ], containsMonsters);

  // can filter by multiple conditions on the same field
  testPath("/monster?monster_identification_no={gt}200{lt}100439", ["Frankenstein"], containsMonsters);

  // excludes results that match {ne} param for Numbers
  testPath("/monster?monster_identification_no={ne}200", 4, isOfNumber);

  // excludes results that match {ne} param for Strings, case insensitive
  testPath("/monster?name={ne}Biggie Smalls", 5, isOfNumber);
  //
  // excludes results that match {ne} param for Strings, case insensitive
  testPath("/monster?name={not}{iregex}biggie", 4, isOfNumber);

  // handles paging of results
  testPath("/monster?page=2&per_page=4", 2, isOfNumber);

  // defaults to 10 results per page
  testPath("/monster?page=1", 6, isOfNumber);

  // can handle schemaless property
  testPath("/monster?data.mood=sad", ["Big Purple People Eater"], containsMonsters);

  // handles schemaless property with case-insensitivity
  testPath("/monster?data.mood=SAD", 0, isOfNumber);

  // can handle schemaless uppercase property
  testPath("/monster?data.MODE=kill", ["Big Purple People Eater"], containsMonsters);

  // can handle schemaless property number
  testPath("/monster?data.hands=14", ["Clay Johnson"], containsMonsters);

  describe('SchemaString', function(){

      testPath("/monster?name=big%20purple", 0, isOfNumber);
  
      testPath("/monster?name=big%20pUrple%20People%20Eater", 0, isOfNumber);
  
      testPath("/monster?name=Big%20Purple%20People%20Eater", ["Big Purple People Eater"], containsMonsters);
  
      testPath("/monster?name={iregex}biggie%20smalls", ["Biggie Smalls", "Biggie Smalls the 2nd"], containsMonsters);

  });

  describe('SchemaNumber', function(){

      // returns correct result for a basic search
      testPath("/monster?monster_identification_no=301", ["Frankenstein"], containsMonsters);
  
      // does not do partial matching by default
      testPath("/monster?monster_identification_no=30", 0, isOfNumber);
  
      // returns correct results for {mod}
          
      testPath("/monster?monster_identification_no={mod}150,1", [ "Big Purple People Eater", "Frankenstein" ], containsMonsters);
  
      // returns correct results for {gt}
      testPath("/monster?monster_identification_no={gt}100439", ["Biggie Smalls the 2nd"], containsMonsters);
  
      // returns correct results for {gte}
      testPath("/monster?monster_identification_no={gte}100439", ["Biggie Smalls", "Biggie Smalls the 2nd"], containsMonsters);
  
      // returns correct results for {lt}
      testPath("/monster?monster_identification_no={lt}200", ["Big Purple People Eater"], containsMonsters);
  
      // returns correct results for {lte}
      testPath("/monster?monster_identification_no={lte}200", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
  
      // returns correct results for {in}
      testPath("/monster?monster_identification_no=1,301", ["Big Purple People Eater", "Frankenstein"], containsMonsters);
  
      // excludes results matching values specified in {nin} for Numbers
      testPath("/monster?monster_identification_no={nin}1,301", ["Biggie Smalls", "Biggie Smalls the 2nd", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
  
      // excludes results matching values specified in {nin} for Strings, case insensitive
      testPath("/monster?name={nin}Big Purple People Eater,Frankenstein", ["Biggie Smalls", "Biggie Smalls the 2nd", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
  
      /* have to dig up on expected behaviour of this query
       * - first idea would be - all monsters containing at least one food that has a name different than kale or beets
       * - according to mongo docs - all monsters that contain only food with names different from kale and beets
       *   but it returns all of them
      // excludes results matching values specified in {nin} for subdocuments
      testPath("/monster?foods.name={nin}kale,beets", [ "Biggie Smalls", "Biggie Smalls the 2nd" ], containsMonsters);
      */

  });

  describe('SchemaBoolean', function(){

      // parses "true" as true
      testPath("/monster?eats_humans=true", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
      
      // parses "t" as true
      testPath("/monster?eats_humans=t", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
      
      // parses "yes" as true
      testPath("/monster?eats_humans=yes", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
      
      // parses "y" as true
      testPath("/monster?eats_humans=y", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
      
      // parses "1" as true
      testPath("/monster?eats_humans=1", ["Big Purple People Eater", "Bessie the Lochness Monster", "Clay Johnson"], containsMonsters);
      
      // parses anything else as false
      testPath("/monster?eats_humans=kljahsdflakjsf", ["Frankenstein", "Biggie Smalls", "Biggie Smalls the 2nd"], containsMonsters);
      
      // ignores a blank param
      testPath("/monster?eats_humans=", 6, isOfNumber);

  });

  describe('SubSchema', function(){

      describe('SchemaString', function(){
          
          // does a basic filter
          testPath("/monster?foods.name=Kale", ["Big Purple People Eater", "Frankenstein"], containsMonsters);
          
          // Defaults to {in}
          testPath("/monster?foods.name=Kale,Beets", ["Big Purple People Eater", "Frankenstein"], containsMonsters);
      
          // calculates {in} correctly
          testPath("/monster?foods.name={in}{regex}^K,^W", ["Big Purple People Eater", "Frankenstein"], containsMonsters);

      });
      
      
      describe('SchemaNumber', function(){
      
          // does a basic filter
          testPath("/monster?foods.calories={gt}350", ["Biggie Smalls the 2nd"], containsMonsters);
      
      });
      
      describe('SchemaBoolean', function(){
      
          // does a basic filter
          testPath("/monster?foods.vegetarian=t", ["Big Purple People Eater", "Frankenstein"], containsMonsters);
      
      });
      
 });

});

function testPath(path, expected, matcher) {
    it(path, function(done) {

        request({ url: 'http://localhost:3000' + path, json: true }, function (error, response, content) {
          matcher( expected, content, done );
        });

    });
}

function containsMonsters(expected, got, done) {
    expect(got.length).to.equal(expected.length);
    var names = got.map(function(e) { return e.name; });
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(names).to.contain(expected[i]);
    done();
}

function orderedMatch(expected, got, done) {
    expect(got.length).to.equal(expected.length);
    for ( var i = 0, ii = expected.length; i < ii ; i++ )
        expect(got[i].name).to.equal(expected[i]);
    done();
}

function hasMonster (expected, got, done) {
  expect( ~getIndexOf(got, expected) ).to.be.ok();
  done();
}

function getIndexOf(pool, searched) {
    return pool.map(function(e) { return e.name; }).indexOf(searched);
}

function isOfNumber (expected, got, done) {
  expect(got.length).to.equal(expected);
  done();
}

function inOrder(expected, got, done) {
  var index1 = getIndexOf(got, expected[0]);
  var index2 = getIndexOf(got, expected[1]);
  expect(index1).to.not.equal(-1);
  expect(index2).to.not.equal(-1);
  expect(index1).to.be.lessThan(index2);
  done();
}

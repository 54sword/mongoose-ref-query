"use strict";

describe("schemeTypes", function(){

  testPath("/rainbow?name=albert", ["albert"], nameUnorderedMatch);

  testPath("/rainbow?living=false", ["noe","jael"], nameUnorderedMatch);

  testPath("/rainbow?mixed=texty", [], nameUnorderedMatch);

  testPath("/rainbow?mixed=texty!", ["noe"], nameUnorderedMatch);

  // on mixed a text search is performed
  testPath("/rainbow?ofMixed=3", [], nameUnorderedMatch);

  testPath("/rainbow?mixed.mixedProperty=mixedvalue", ["jael"], nameUnorderedMatch);

  testPath("/rainbow?ofMixed.anything=i want", ["albert"], nameUnorderedMatch);

  testPath("/rainbow?age=18", ["albert"], nameUnorderedMatch);

  testPath("/rainbow?ofNumber=12", ["albert", "jael"], nameUnorderedMatch);

  testPath("/rainbow?ofNumber=11", ["albert"], nameUnorderedMatch);

  testPath("/rainbow?ofNumber={all}12,11", ["albert"], nameUnorderedMatch);

  testPath("/rainbow?ofNumber={nin}33,11", ["jael"], nameUnorderedMatch);

  testPath("/rainbow?ofString={in}{regex}^a,^b", ["albert", "noe"], nameUnorderedMatch);

  testPath("/rainbow?ofString={in}", ["jael"], nameUnorderedMatch);

  testPath("/rainbow?ofString={in}{null}", ["noe"], nameUnorderedMatch);

  testPath("/rainbow?name={nin}{regex}^n,^j", ["albert"], nameUnorderedMatch);

  /* missing date schemaType support
  testPath("/rainbow?updated=2013-03-01T01:10:00", ["albert"], nameUnorderedMatch);
  */

  /* should fail because buffer is not supported as schematype
  testPath("/rainbow?binary=cus", ["albert"]);
  */

  testPath("/rainbow?ofNumber={size}2", ["jael"], nameUnorderedMatch);

  describe("text index search", function() {

      // any of the words
      testPath("/rainbow?$text=pears apples", ["noe", "jael"], nameUnorderedMatch);

      // matches phrase
      testPath("/rainbow?$text=\"some apples\"", ["noe"], nameUnorderedMatch);

      // all containing the word "text" excluding the ones containing the word apples
      testPath("/rainbow?$text=text -apples", ["albert"], nameUnorderedMatch);

      /*// it will search in italian language see http://docs.mongodb.org/manual/reference/operator/query/text/#op._S_text
       * ( lazy to see how the "ignore language specific words" works )
      testPath("/rainbow?indexedText={text}pears apples,it", write rest of test );
      */

      // works combined with other criterias
      testPath("/rainbow?$text=apples&ofNumber=12", ["jael"], nameUnorderedMatch);

  });

});

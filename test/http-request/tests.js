var expect = require("expect.js"),
    mongooseApiQuery = require("../../lib/mongoose-api-query.js"), 
    testing = require('../functions.js');

describe('http GET request parsing', function(){

    it("parses basic value", function() {

        var input, output, expected;

        input = {
             a : "b.c.d"
        };

        expected = {
            $and : [
                { a : { $in : ["b.c.d"] } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("parses multiple operator", function() {

        var input, output, expected;

        input = {
            a : "{in}b{gt}c"
        };

        expected = {
            $and: [
                { a : { $in : ["b"] } },
                { a : { $gt : "c" } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("parses multiple arguments", function() {

        var input, output, expected;

        input = {
            a : "{in}b,c,d{in}{regex}/^A/,/^B/"
        };

        expected = {
            $and: [
                { a : { $in : ["b","c","d"] } },
                { a : { $in : [/^A/,/^B/] } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("if a condition doesn't start with a primary operator the first operator will be null", function() {

        var input, output, expected;

        input = {
            a : "{in}b,c,d{iregex}/^A/,/^B/"
        };

        expected = {
            $and: [
                { a : { $in : ["b","c","d"] } },
                { a : { $in : [/^A/i,/^B/i] } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("parses config options into separate object", function() {

        var input, output, expected;

        input = {
            a : "{in}b,c,d{iregex}/^A/,/^B/",
            page : 3,
            per_page : 2
        };

        expected = {
            $and: [
                { a : { $in : ["b","c","d"] } },
                { a : { $in : [/^A/i,/^B/i] } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );
        expect(output.config.page).to.be(3);
        expect(output.config.per_page).to.be(2);

    });

    it("parses multiple arguments for multiple fields correctly", function() {

        var input, output, expected;

        input = {
            first : "{in}b,c,d{in}{regex}e,f",
            second : "{in}z,x,y{in}{regex}8,3"
        };

        expected = {
            $and : [
                { first : { $in: ["b","c","d"] } },
                { first : { $in: [/e/,/f/] } },
                { second : { $in: ["z","x","y"] } },
                { second : { $in: [/8/,/3/] } },
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("parsing of operators without arguments", function() {

        var input, output, expected;

        input = {
            a : "{in}{regex}{nin}"
        };

        expected = {
            $and: [
                { a: { $in: [] } },
                { a: { $nin: [] } },
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("interprets escape sequences as it should", function() {

        var input, output, expected;

        input = {
            a : "{in}val\\{ue,sec\\,ond,thi\\\\rd"
        };

        expected = {
            $and: [
                { a : { $in: ["val{ue", "sec,ond", "thi\\rd"] } }
            ]
        };

        output = mongooseApiQuery.__parseQuery( input );

        objectsSame( expected, output.mongo_expression );

    });

    it("unescaped characters can cause unexpected behaviour", function() {

        var input = {
            a : "{in}val{ue"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Reached end of string inside operator!$/);

    });

    it("escaping an invalid character throws an error", function() {

        var input = {
            a : "{in}{regex}{in}th\\e val"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Invalid escape sequence/);

    });

    it("escaping the end of string throws an error", function() {

        var input = {
            a : "{in}{regex}{in}the val\\"
        };

        expect(function() {
          mongooseApiQuery.__parseQuery( input );
        }).to.throwError(/^Escaped end of string!$/);

    });

});

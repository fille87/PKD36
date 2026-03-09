import { interpret_source } from "../src/interpret_source";

describe("Interpret literals", () => {
    test("Interpret number", () => {
        const s = "1.5";
        expect(interpret_source("test", s)).toBe(1.5);
    });
    test("Interpret string", () => {
        const s = '"a"';
        expect(interpret_source("test", s)).toBe("a");
    });
    test("Interpret boolean", () => {
        const s = "true";
        expect(interpret_source("test", s)).toBe(true);
    });
    test("Interpret null", () => {
        const s = "null";
        expect(interpret_source("test", s)).toBe(null);
    });
});

describe("Interpret binary operators", () => {
    test("Interpret plus", () => {
        const s = "1 + 1";
        expect(interpret_source("test", s)).toBe(2);
    });
    test("Interpret string concatenation", () => {
        const s = '"a" + "b"';
        expect(interpret_source("test", s)).toBe("ab");
    });
    test("Interpret minus", () => {
        const s = "1 - 1";
        expect(interpret_source("test", s)).toBe(0);
    });
    test("Interpret times", () => {
        const s = "2 * 2";
        expect(interpret_source("test", s)).toBe(4);
    });
    test("Interpret string repetition", () => {
        const s = '"a" * 2';
        expect(interpret_source("test", s)).toBe("aa");
    });
    test("Interpret division", () => {
        const s = "2 / 2";
        expect(interpret_source("test", s)).toBe(1);
    });
    test("Interpret exponentiation", () => {
        const s = "2 ** 3";
        expect(interpret_source("test", s)).toBe(8);
    });
});

describe("Associativity and orders of operation", () => {
    test("Addition and multiplication", () => {
        const s = "2 + 3 * 4";
        expect(interpret_source("test", s)).toBe(14);
    });
    test("Multiplication and exponentiation", () => {
        const s = "2 * 3 ** 4";
        expect(interpret_source("test", s)).toBe(2 * Math.pow(3, 4));
    });
    test("Left to right", () => {
        const s = "2 ** 3 ** 2";
        expect(interpret_source("test", s)).toBe(Math.pow(8, 2));
    });
    test("Grouping", () => {
        const s = "2 ** (3 ** 2)";
        expect(interpret_source("test", s)).toBe(Math.pow(2, 9));
    });
});

describe("Interpret unary operators", () => {
    test("Interpret minus", () => {
        const s = "-1";
        expect(interpret_source("test", s)).toBe(-1);
    });
    test("Interpret multiple minuses", () => {
        const s = "---1";
        expect(interpret_source("test", s)).toBe(-1);
    });
    test("Interpret bang", () => {
        const s = "!true";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("Interpret multiple bangs", () => {
        const s = "!!true";
        expect(interpret_source("test", s)).toBe(true);
    });
});



describe("Loops", () => {
    test("Break with no return", () => {
        const s = "loop { break; }";
        expect(interpret_source("test", s)).toBe(null);
    });
    test("Can assign to global variables", () => {
        const s = "var x; { x = true; } x";
        expect(interpret_source("test", s)).toBe(true);
    });
    test("Break with return value", () => {
        const s = "loop { break return 1; }";
        expect(interpret_source("test", s)).toBe(1);
    });
    test("While", () => {
        const s = "var x = 0; while x < 10 { x = x + 1; }; x";
        expect(interpret_source("test", s)).toBe(10);
    });
    test("Labeled break", () => {
        const s = "loop: a { loop: b { break: a; }; 3 }";
        expect(interpret_source("test", s)).toBe(null);
    });
    test("Labeled break with return value", () => {
        const s = "loop: a { loop: b { break: a return 5; } 3 }";
        expect(interpret_source("test", s)).toBe(5);
    });
    test("Block as while condition", () => {
        const s = "var x = 0; while { x = x + 1; x <= 10 } { x }";
        expect(interpret_source("test", s)).toBe(10);
    });
});

describe("Function calls", () => {
    test("No arguments", () => {
        const s = "fn one() { 1 } one()";
        expect(interpret_source("test", s)).toBe(1);
    });
    test("One argument", () => {
        const s = "fn ret(n) { n } ret(2)";
        expect(interpret_source("test", s)).toBe(2);
    });
    test("Multiple arguments", () => {
        const s = "fn add(a, b, c) { a + b + c } add(1, 2, 3)";
        expect(interpret_source("test", s)).toBe(6);
    });
    test("Overloading", () => {
        const s = "fn fun(a, b) { a + b } fn fun(a, b, c) { a * b * c } fun(1, 2, 3) + fun(5, 5)";
        expect(interpret_source("test", s)).toBe(16);
    });
    test("Nested calls", () => {
        const s = "fn pow2(n) { n ** 2 } pow2(pow2(3))";
        expect(interpret_source("test", s)).toBe(Math.pow(Math.pow(3, 2), 2));
    });
});

describe("Logical operators", () => {
    test("true and true", () => {
        const s = "true and true";
        expect(interpret_source("test", s)).toBe(true);
    });
    test("true and false", () => {
        const s = "true and false";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("false and false", () => {
        const s = "false and false";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("and chaining", () => {
        const s = "true and true and false";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("true or true", () => {
        const s = "true or true";
        expect(interpret_source("test", s)).toBe(true);
    });
    test("true or false", () => {
        const s = "true or false";
        expect(interpret_source("test", s)).toBe(true);
    });
    test("false or false", () => {
        const s = "false or false";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("or chaining", () => {
        const s = "false or false or true";
        expect(interpret_source("test", s)).toBe(true);
    });
});

describe("If/else", () => {
    test("Basic if/else", () => {
        const s = "var x = true; if true { x = false; } else { x = true; }; x";
        expect(interpret_source("test", s)).toBe(false);
    });
    test("If/else is an expression with a return value", () => {
        const s = "var x = if true { false } else { true }; x";
        expect(interpret_source("test", s)).toBe(false);
    });
});

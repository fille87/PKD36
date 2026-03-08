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

describe("Interpret unary operators", () => {
    test("Interpret minus", () => {
        const s = "-1";
        expect(interpret_source("test", s)).toBe(-1);
    });
    test("Interpret bang", () => {
        const s = "!true";
        expect(interpret_source("test", s)).toBe(false);
    });
});

describe("Loops", () => {
    test("Break with no return", () => {
        const s = "loop { break; }";
        expect(interpret_source("test", s)).toBe(null);
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
});

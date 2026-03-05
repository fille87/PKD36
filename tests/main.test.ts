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

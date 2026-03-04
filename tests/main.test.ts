import { evaluate_source } from "../src/interpret_source";

describe("Interpret literals", () => {
    test("Interpret number", () => {
        const s = "1";
        expect(evaluate_source("test", s)).toBe(1);
    });
    test("Interpret string", () => {
        const s = '"a"';
        expect(evaluate_source("test", s)).toBe("a");
    });
    test("Interpret boolean", () => {
        const s = "true";
        expect(evaluate_source("test", s)).toBe(true);
    });
});

import { List, list } from "../lib/list";
import { Token, TokenType, scan, has_errors, token } from "../src/scanner";

test("Scan a single digit", () => {
    const s = "1";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 1), 
        token(TokenType.EOF)
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a multi-digit integer", () => {
    const s = "323";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 323), 
        token(TokenType.EOF)
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a float", () => {
    const s = "3.25";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 3.25), 
        token(TokenType.EOF)
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan plus", () => {
    const s = "1 + 2";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 1), 
        token(TokenType.PLUS),
        token(TokenType.NUMBER_LIT, 2), 
        token(TokenType.EOF),
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan minus", () => {
    const s = "-2";
    const expected = list<Token>(
        token(TokenType.MINUS),
        token(TokenType.NUMBER_LIT, 2), 
        token(TokenType.EOF),
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan times", () => {
    const s = "1 * 2";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 1), 
        token(TokenType.TIMES),
        token(TokenType.NUMBER_LIT, 2), 
        token(TokenType.EOF),
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan division", () => {
    const s = "1 / 2";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 1), 
        token(TokenType.DIVIDE),
        token(TokenType.NUMBER_LIT, 2), 
        token(TokenType.EOF),
    );
    expect(scan(s)).toStrictEqual(expected);
})

test("Multi line", () => {
    const s = "1 \n 2 \n 3";
    const expected = list<Token>(
        token(TokenType.NUMBER_LIT, 1), 
        token(TokenType.NUMBER_LIT, 2), 
        token(TokenType.NUMBER_LIT, 3), 
        token(TokenType.EOF),
    );
    expect(scan(s)).toStrictEqual(expected);
})

// TEMPORARY: Update to proper error handling later
test("Invalid float", () => {
    const s = "3..a";
    expect(has_errors(scan(s))).toBe(true);
})

test("Invalid character", () => {
    const s = "~";
    expect(has_errors(scan(s))).toBe(true);
})

test("Only one error per line", () => {
    const s = "~ @ \n @ \n 5";
    const result = scan(s);
    expect(has_errors(result)).toBe(true);
    expect(result!.length).toBe(2);
})


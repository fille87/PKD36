import { List, list } from "../lib/list";
import { Token, TokenType, scan, has_errors } from "../src/scanner";

test("Scan a single digit", () => {
    const s = "1";
    const expected = list<Token>({ type: TokenType.NUMBER_LIT, value: 1}, TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a multi-digit integer", () => {
    const s = "323";
    const expected = list<Token>({ type: TokenType.NUMBER_LIT, value: 323}, TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a float", () => {
    const s = "3.25";
    const expected = list<Token>({ type: TokenType.NUMBER_LIT, value: 3.25}, TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

// TEMPORARY: Update to proper error handling later
test("Invalid float", () => {
    const s = "3..a";
    expect(has_errors(scan(s))).toBe(true);
})

test("Scan plus", () => {
    const s = "1 + 2";
    const expected = list<Token>(
        { type: TokenType.NUMBER_LIT, value: 1}, 
        TokenType.PLUS,
        { type: TokenType.NUMBER_LIT, value: 2}, 
        TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan minus", () => {
    const s = "-2";
    const expected = list<Token>(
        TokenType.MINUS,
        { type: TokenType.NUMBER_LIT, value: 2}, 
        TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan times", () => {
    const s = "1 * 2";
    const expected = list<Token>(
        { type: TokenType.NUMBER_LIT, value: 1}, 
        TokenType.TIMES,
        { type: TokenType.NUMBER_LIT, value: 2}, 
        TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan division", () => {
    const s = "1 / 2";
    const expected = list<Token>(
        { type: TokenType.NUMBER_LIT, value: 1}, 
        TokenType.DIVIDE,
        { type: TokenType.NUMBER_LIT, value: 2}, 
        TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

test("Multi line", () => {
    const s = "1 \n 2 \n 3";
    const expected = list<Token>(
        { type: TokenType.NUMBER_LIT, value: 1}, 
        { type: TokenType.NUMBER_LIT, value: 2}, 
        { type: TokenType.NUMBER_LIT, value: 3}, 
        TokenType.EOF);
    expect(scan(s)).toStrictEqual(expected);
})

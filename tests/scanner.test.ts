import { TokenType, scan, token } from "../src/scanner";
import { has_errors } from "../src/error";

test("Scan a single digit", () => {
    const s = "1";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(1, TokenType.EOF)
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a multi-digit integer", () => {
    const s = "323";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 323), 
        token(3, TokenType.EOF)
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a float", () => {
    const s = "3.25";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 3.25), 
        token(4, TokenType.EOF)
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan plus", () => {
    const s = "1 + 2";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.PLUS),
        token(4, TokenType.NUMBER_LIT, 2), 
        token(5, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan minus", () => {
    const s = "-2";
    const expected = [
        token(0, TokenType.MINUS),
        token(1, TokenType.NUMBER_LIT, 2), 
        token(2, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan times", () => {
    const s = "1 * 2";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.TIMES),
        token(4, TokenType.NUMBER_LIT, 2), 
        token(5, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan exponentiation", () => {
    const s = "1 ** 2";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.POW),
        token(5, TokenType.NUMBER_LIT, 2), 
        token(6, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan division", () => {
    const s = "1 / 2";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.DIVIDE),
        token(4, TokenType.NUMBER_LIT, 2), 
        token(5, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan negation", () => {
    const s = "!false";
    const expected = [
        token(0, TokenType.BANG), 
        token(1, TokenType.FALSE), 
        token(6, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan comparison", () => {
    const s = "1 < 2 \n 2 > 1 \n true != false \n 0 >= 0 \n 0 <= 0";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.LESS), 
        token(4, TokenType.NUMBER_LIT, 2), 
        token(8, TokenType.NUMBER_LIT, 2), 
        token(10, TokenType.GREATER), 
        token(12, TokenType.NUMBER_LIT, 1), 
        token(16, TokenType.TRUE), 
        token(21, TokenType.BANG_EQ), 
        token(24, TokenType.FALSE), 
        token(32, TokenType.NUMBER_LIT, 0), 
        token(34, TokenType.GREATER_EQ), 
        token(37, TokenType.NUMBER_LIT, 0), 
        token(41, TokenType.NUMBER_LIT, 0), 
        token(43, TokenType.LESS_EQ), 
        token(46, TokenType.NUMBER_LIT, 0), 
        token(47, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan parentheses", () => {
    const s = "(1)";
    const expected = [
        token(0, TokenType.LEFT_PAREN), 
        token(1, TokenType.NUMBER_LIT, 1), 
        token(2, TokenType.RIGHT_PAREN), 
        token(3, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a block", () => {
    const s = "{ 1 }";
    const expected = [
        token(0, TokenType.LEFT_BRACE), 
        token(2, TokenType.NUMBER_LIT, 1), 
        token(4, TokenType.RIGHT_BRACE), 
        token(5, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a comment", () => {
    const s = "1 :: This is a comment \n 2";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(25, TokenType.NUMBER_LIT, 2),
        token(26, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan a statement", () => {
    const s = "5;";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 5), 
        token(1, TokenType.SEMICOLON), 
        token(2, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Scan assignment", () => {
    const s = "var x = 5;";
    const expected = [
        token(0, TokenType.VAR), 
        token(4, TokenType.IDENTIFIER, "x"), 
        token(6, TokenType.EQUAL), 
        token(8, TokenType.NUMBER_LIT, 5), 
        token(9, TokenType.SEMICOLON), 
        token(10, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("If/else and equality comparison", () => {
    const s = "if x == 3 { 1 } else { 2 }";
    const expected = [
        token(0, TokenType.IF), 
        token(3, TokenType.IDENTIFIER, "x"), 
        token(5, TokenType.DOUBLE_EQUAL), 
        token(8, TokenType.NUMBER_LIT, 3), 
        token(10, TokenType.LEFT_BRACE), 
        token(12, TokenType.NUMBER_LIT, 1), 
        token(14, TokenType.RIGHT_BRACE), 
        token(16, TokenType.ELSE),
        token(21, TokenType.LEFT_BRACE), 
        token(23, TokenType.NUMBER_LIT, 2), 
        token(25, TokenType.RIGHT_BRACE), 
        token(26, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Labeled loop", () => {
    const s = "loop: name { break name; }";
    const expected = [
        token(0, TokenType.LOOP), 
        token(4, TokenType.COLON), 
        token(6, TokenType.IDENTIFIER, "name"), 
        token(11, TokenType.LEFT_BRACE), 
        token(13, TokenType.BREAK), 
        token(19, TokenType.IDENTIFIER, "name"), 
        token(23, TokenType.SEMICOLON), 
        token(25, TokenType.RIGHT_BRACE), 
        token(26, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Function declaration", () => {
    const s = "fn plus(a, b) { a + b }";
    const expected = [
        token(0, TokenType.FN), 
        token(3, TokenType.IDENTIFIER, "plus"), 
        token(7, TokenType.LEFT_PAREN), 
        token(8, TokenType.IDENTIFIER, "a"), 
        token(9, TokenType.COMMA), 
        token(11, TokenType.IDENTIFIER, "b"), 
        token(12, TokenType.RIGHT_PAREN), 
        token(14, TokenType.LEFT_BRACE), 
        token(16, TokenType.IDENTIFIER, "a"), 
        token(18, TokenType.PLUS), 
        token(20, TokenType.IDENTIFIER, "b"), 
        token(22, TokenType.RIGHT_BRACE), 
        token(23, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Multi line", () => {
    const s = "1 \n 2 \n 3";
    const expected = [
        token(0, TokenType.NUMBER_LIT, 1), 
        token(4, TokenType.NUMBER_LIT, 2), 
        token(8, TokenType.NUMBER_LIT, 3), 
        token(9, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("String literal", () => {
    const s = '"string"';
    const expected = [
        token(0, TokenType.STRING_LIT, "string"),
        token(8, TokenType.EOF),
    ];
    expect(scan(s)).toStrictEqual(expected);
})

test("Multi line string", () => {
    const s = '"string \n literal"';
    const expected = [
        token(0, TokenType.STRING_LIT, "string \n literal"),
        token(18, TokenType.EOF),
    ];
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


import { parse } from "../src/parser";
import { TokenType, Token } from "../src/scanner"
import { Binary, ExpressionStatement, Variable, VariableDec, FunctionDec, While, Literal } from "../lib/types";

function token(type: TokenType, value: any = null, index = 0): Token {
    return { type, value, index };
}

describe("Parser - basic expressions", () => {

    test("parses number literal", () => {
        const tokens = [
            token(TokenType.NUMBER_LIT, 42, 0),
            token(TokenType.SEMICOLON, null, 2),
            token(TokenType.EOF, null, 3),
        ];

        const result = parse(tokens);

        expect(result.has_error).toBe(false);
        expect(result.output.length).toBe(1);
        expect(result.output[0].type).toBe("Expression_statement");
    });

});

test("parses binary expression 1 + 2;", () => {
    const tokens = [
        token(TokenType.NUMBER_LIT, 1, 0),
        token(TokenType.PLUS, null, 1),
        token(TokenType.NUMBER_LIT, 2, 2),
        token(TokenType.SEMICOLON, null, 3),
        token(TokenType.EOF, null, 4),
    ];

    const result = parse(tokens);

    expect(result.has_error).toBe(false);

    const stmt = result.output[0];
    
    expect(stmt.type).toBe("Expression_statement");

    const expr = (stmt as ExpressionStatement).expression;
    expect(expr.type).toBe("Binary");
    expect((expr as Binary).operator).toBe("+");
});
test("recovers after syntax error", () => {
    const tokens = [
        token(TokenType.NUMBER_LIT, 1, 0),
        token(TokenType.PLUS, null, 1),
        token(TokenType.SEMICOLON, null, 2), // invalid expression
        token(TokenType.PRINT, null, 3),
        token(TokenType.NUMBER_LIT, 2, 4),
        token(TokenType.SEMICOLON, null, 5),
        token(TokenType.EOF, null, 6),
    ];

    const result = parse(tokens);

    expect(result.has_error).toBe(true);

    // Should still parse the print statement
    expect(result.output.length).toBeGreaterThan(0);
});

test("parses variable declaration", () => {
    const tokens = [
        token(TokenType.VAR, null, 0),
        token(TokenType.IDENTIFIER, "x", 1),
        token(TokenType.EQUAL, null, 2),
        token(TokenType.NUMBER_LIT, 5, 3),
        token(TokenType.SEMICOLON, null, 4),
        token(TokenType.EOF, null, 5),
    ];

    const result = parse(tokens);
    expect(result.has_error).toBe(false);

    const stmt = result.output[0];
    expect(stmt.type).toBe("Variable_declaration");
    expect((stmt as VariableDec).name).toBe("x");
});

describe("Parser - function declaration", () => {

    test("parses simple function declaration", () => {
        const tokens = [
            token(TokenType.FN, null, 0),
            token(TokenType.IDENTIFIER, "add", 1),
            token(TokenType.LEFT_PAREN, null, 2),
            token(TokenType.IDENTIFIER, "a", 3),
            token(TokenType.COMMA, null, 4),
            token(TokenType.IDENTIFIER, "b", 5),
            token(TokenType.RIGHT_PAREN, null, 6),
            token(TokenType.LEFT_BRACE, null, 7),

            token(TokenType.RETURN, null, 8),
            token(TokenType.IDENTIFIER, "a", 9),
            token(TokenType.PLUS, null, 10),
            token(TokenType.IDENTIFIER, "b", 11),
            token(TokenType.SEMICOLON, null, 12),

            token(TokenType.RIGHT_BRACE, null, 13),
            token(TokenType.EOF, null, 14),
        ];

        const result = parse(tokens);

        expect(result.has_error).toBe(false);
        expect(result.output.length).toBe(1);

        const fn = result.output[0];

        expect(fn.type).toBe("Function_declaration");
        
        expect((fn as FunctionDec).name).toBe("add");
        expect((fn as FunctionDec).params).toEqual(["a", "b"]);

        expect((fn as FunctionDec).body.type).toBe("Block");
        expect((fn as FunctionDec).body.body.length).toBe(1);

        const returnStmt = (fn as FunctionDec).body.body[0];
        expect(returnStmt.type).toBe("Return");
    });

});


test("parses unlabeled while loop", () => {
    const tokens = [
        token(TokenType.WHILE, null, 0),
        token(TokenType.TRUE, null, 1),

        token(TokenType.LEFT_BRACE, null, 2),

        token(TokenType.PRINT, null, 3),
        token(TokenType.NUMBER_LIT, 1, 4),
        token(TokenType.SEMICOLON, null, 5),

        token(TokenType.RIGHT_BRACE, null, 6),
        token(TokenType.EOF, null, 7),
    ];

    const result = parse(tokens);

    expect(result.has_error).toBe(false);
    expect(result.output.length).toBe(1);

    const whileStmt = result.output[0];

    expect((whileStmt as While).type).toBe("While");
    expect((whileStmt as While).name).toBeNull();

    expect((whileStmt as While).condition.type).toBe("Literal");
    expect(((whileStmt as While).condition as Literal).value).toBe(true);

    expect((whileStmt as While).body.type).toBe("Block");
    expect((whileStmt as While).body.body.length).toBe(1);
});

test("parses labeled while loop", () => {
    const tokens = [
        token(TokenType.WHILE, null, 0),
        token(TokenType.IDENTIFIER, "x", 1),
        token(TokenType.LESS, null, 2),
        token(TokenType.NUMBER_LIT, 10, 3),

        token(TokenType.COLON, null, 4),
        token(TokenType.IDENTIFIER, "outer", 5),

        token(TokenType.LEFT_BRACE, null, 6),

        token(TokenType.PRINT, null, 7),
        token(TokenType.NUMBER_LIT, 1, 8),
        token(TokenType.SEMICOLON, null, 9),

        token(TokenType.RIGHT_BRACE, null, 10),
        token(TokenType.EOF, null, 11),
    ];

    const result = parse(tokens);

    expect(result.has_error).toBe(false);
    expect(result.output.length).toBe(1);

    const whileStmt = result.output[0];

    expect(whileStmt.type).toBe("While");
    expect((whileStmt as While).name).toBe("outer");

    expect((whileStmt as While).condition.type).toBe("Binary");
    const bin: Binary = (whileStmt as While).condition as Binary
    expect(bin.left.type).toBe("Variable");
    expect((bin.left as Variable).name).toBe("x");
    expect(bin.operator).toBe("<");
    expect(bin.right.type).toBe("Literal");
    expect((bin.right as Literal).value).toBe(10);

    expect((whileStmt as While).body.type).toBe("Block");
    expect((whileStmt as While).body.body.length).toBe(1);
});

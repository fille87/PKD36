import { UntypescriptError, ErrorKind } from "./error";
import { ch_lookup, ch_empty, ChainingHashtable, ch_insert } from "../lib/hashtables";

export enum TokenType {
    COMMA, PLUS, MINUS, TIMES, POW, DIVIDE,
    BANG, BANG_EQ, EQUAL, DOUBLE_EQUAL, GREATER, GREATER_EQ, LESS, LESS_EQ,
    RIGHT_PAREN, LEFT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    SEMICOLON, COLON, EOF,
    AND, OR, IF, ELSE, LOOP, WHILE, FN, VAR, RETURN, TRUE, FALSE, NULL, BREAK, CONTINUE,

    // Tokens that take a literal value
    NUMBER_LIT, STRING_LIT, IDENTIFIER, 
}

export type Token = {
    type: TokenType,
    index: number,
    value: Literal | undefined,
}

type Literal = number | string;

type ScannerResult = Array<Token> | Array<UntypescriptError>;

// A string with length 1
type Character = string; 

type Scanner = {
    errored: boolean;
    input: string;
    input_length: number;
    output: Array<Token>;
    index: number;
};

/**
 * Initializes a new scanner over an input string
 * @param input Input string to scan
 * @returns A scanner starting at the beginning of the string
 */
function scanner_init(input: string): Scanner {
    return {
        errored: false,
        input,
        input_length: input.length,
        output: [],
        index: 0,
    }
}

/**
 * Checks if a character is a whitespace character
 * @param ch The character to check
 * @returns True if the character is whitespace, false otherwise
 */
function is_whitespace(ch: Character): boolean {
    return ch === " " || ch === "\t" || ch === "\r";
}

/**
 * Checks if a character is a digit
 * @param ch The character to check
 * @returns True if the character is a digit, false otherwise
 */
function is_digit(str: Character | null): boolean {
    if (str === null || is_whitespace(str)) {
        return false;
    }
    const n = Number(str);
    return !isNaN(n) && n >= 0 && n <= 9;
}

/**
 * Checks if a character is an english letter
 * @param ch The character to check
 * @returns True if the character is a letter, false otherwise
 */
function is_letter(str: Character | null): boolean {
    if (str === null) {
        return false;
    }
    const matches = str.match("[a-zA-Z]");
    return (matches !== null && matches.length > 0);
}


/**
 * Makes a token of the specified type, value and index
 * @param index The index where the token is found
 * @param type The type of the token
 * @param value Optional, a literal value for tokens that utilize them
 * @returns A new Token with the specified values
 */
export function token(index: number, type: TokenType, value?: Literal) {
    return {
        type,
        index,
        value,
    };
}

/**
 * Scans an input string for tokens
 * @param input Input string to scan
 * @returns A List of Tokens if the scan is successful. If any parsing errors occur, instead returns a List of Errors
 */
export function scan(input: string): ScannerResult {
    // Emits a parse error pointing at a specified index
    function error_at(message: string, index: number) {
        scanner.errored = true;
        // const error: Error = {
        //     kind: ErrorKind.ParseError,
        //     message: message,
        //     index: index,
        // };
        const error = new UntypescriptError(ErrorKind.ParseError, message, index);
        errors.push(error);
    }

    // Emits a parse error at the scanner's current index
    function error(message: string) {
        error_at(message, scanner.index);
    }

    function make_token(type: TokenType, value?: Literal) {
        return {
            type,
            index: scanner.index,
            value,
        };
    }

    // Peeks at the current character or ahead with a custom offset
    function peek(offset: number = 0): Character {
        return scanner.index + offset >= scanner.input_length 
            ? "\0" 
            : scanner.input[scanner.index + offset];
    }

    // Consumes the current character
    function advance() {
        const value = peek();
        scanner.index += 1;
        return value;
    }

    // Scan a floating point number, emitting an error on faulty syntax
    function scan_number(): Token | null {
        const start = scanner.index;
        while(is_digit(peek())) {
            advance();
        }
        if(peek() === ".") {
            if (!is_digit(peek(1))) {
                advance();
                error("Invalid number literal. Expected digit after '.', got '" + peek() + "'");
                skip_line = true;
                return null;
            }
            advance();
        }
        while(is_digit(peek())) {
            advance();
        }

        return token(
            start,
            TokenType.NUMBER_LIT, 
            Number(scanner.input.substring(start, scanner.index))
        );
    }

    // Scan a string literal, emitting an error on faulty syntax
    function scan_string(): Token | null {
        const start = scanner.index;
        if (peek() !==  '"') {
            return null;
        }
        advance();
        while(true) {
            if (peek() === "\0") {
                error_at("String literal was never closed.", start);
                return null;
            } else if (peek() === '"') {
                advance();
                break;
            }
            advance();
        }

        return token(
            start,
            TokenType.STRING_LIT, 
            scanner.input.substring(start + 1, scanner.index - 1) // Don't include the quotation marks
        );
    }

    // Scan an identifier
    function scan_identifier(): Token {
        const start = scanner.index;
        while(is_letter(peek()) || is_digit(peek())) {
            advance();
        }

        return token(
            start,
            TokenType.IDENTIFIER,
            scanner.input.substring(start, scanner.index)
        );
    }


    let scanner = scanner_init(input);
    let output: Array<Token> = [];
    let errors: Array<UntypescriptError> = [];
    let skip_line = false;

    const keywords: ChainingHashtable<string, TokenType> = ch_empty(14, (word) => word.charCodeAt(0));
    ch_insert(keywords, "and", TokenType.AND);
    ch_insert(keywords, "or", TokenType.OR);
    ch_insert(keywords, "if", TokenType.IF);
    ch_insert(keywords, "else", TokenType.ELSE);
    ch_insert(keywords, "loop", TokenType.LOOP);
    ch_insert(keywords, "while", TokenType.WHILE);
    ch_insert(keywords, "fn", TokenType.FN);
    ch_insert(keywords, "var", TokenType.VAR);
    ch_insert(keywords, "return", TokenType.RETURN);
    ch_insert(keywords, "true", TokenType.TRUE);
    ch_insert(keywords, "false", TokenType.FALSE);
    ch_insert(keywords, "null", TokenType.NULL);
    ch_insert(keywords, "break", TokenType.BREAK);
    ch_insert(keywords, "continue", TokenType.CONTINUE);


    while(true) {
        const ch = peek();
        // If we encounter an error during parsing, 
        // skip the rest of the line to not spam errors afterwards
        if (skip_line) {
            if (ch === "\0") {
                if (!scanner.errored) {
                    output.push(make_token(TokenType.EOF));
                    return output;
                } else {
                    return errors;
                }
            } else if (ch === "\n") {
                skip_line = false;
            }
            advance();
            continue;
        }
        switch (ch) {
            case "\0":
                if (!scanner.errored) {
                    output.push(make_token(TokenType.EOF));
                    return output;
                } else {
                    return errors;
                }
            case ",":
                output.push(make_token(TokenType.COMMA));
                break;
            case "+":
                output.push(make_token(TokenType.PLUS));
                break;
            case "\n":
                break;
            case "-":
                output.push(make_token(TokenType.MINUS));
                break;
            case "*":
                if (peek(1) === "*") {
                    output.push(make_token(TokenType.POW));
                    advance();
                } else {
                    output.push(make_token(TokenType.TIMES));
                }
                break;
            case "/":
                output.push(make_token(TokenType.DIVIDE));
                break;
            case "(":
                output.push(make_token(TokenType.LEFT_PAREN));
                break;
            case ")":
                output.push(make_token(TokenType.RIGHT_PAREN));
                break;
            case ";":
                output.push(make_token(TokenType.SEMICOLON));
                break;
            case ":":
                if(peek(1) === ":") {
                    skip_line = true;
                } else {
                    output.push(make_token(TokenType.COLON));
                }
                break;
            case "{":
                output.push(make_token(TokenType.LEFT_BRACE));
                break;
            case "}":
                output.push(make_token(TokenType.RIGHT_BRACE));
                break;
            case '"':
                const s = scan_string();
                if (s !== null) {
                    output.push(s);
                }
                continue;
            case "=":
                if (peek(1) === "=") {
                    output.push(make_token(TokenType.DOUBLE_EQUAL));
                    advance();
                } else {
                    output.push(make_token(TokenType.EQUAL));
                }
                break;
            case "!":
                if (peek(1) === "=") {
                    output.push(make_token(TokenType.BANG_EQ));
                    advance();
                } else {
                    output.push(make_token(TokenType.BANG));
                }
                break;
            case ">":
                if (peek(1) === "=") {
                    output.push(make_token(TokenType.GREATER_EQ));
                    advance();
                } else {
                    output.push(make_token(TokenType.GREATER));
                }
                break;
            case "<":
                if (peek(1) === "=") {
                    output.push(make_token(TokenType.LESS_EQ));
                    advance();
                } else {
                    output.push(make_token(TokenType.LESS));
                }
                break;
            default:
                if (is_whitespace(ch)) { 
                    break;
                } else if (is_digit(ch)) {
                    const n = scan_number();
                    if (n !== null) {
                        output.push(n);
                    }
                    continue; // The number scanning already advances to the right position
                } else if (is_letter(ch)) {
                    const ident = scan_identifier();
                    const keyword = ch_lookup(keywords, ident.value as string); // Safety: scan_identifier always returns a token with a string in the value field
                    output.push(
                        keyword !== undefined 
                            ? token(ident.index, keyword) 
                            : ident
                    );
                    continue;
                }else {
                    error("Unrecognized character '" + ch + "'");
                    skip_line = true;
                }
                break;
        }
        advance();
    }
}

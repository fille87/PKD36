// import { Value } from "../lib/types";
import { List, list, append as append_list, head } from "../lib/list";

export enum TokenType {
    PLUS,
    MINUS,
    TIMES,
    DIVIDE,
    NUMBER_LIT,
    RIGHT_PAREN,
    LEFT_PAREN,
    EOF,
}

// Temporary error handling
interface Error {
    message: string,
    index: number,
}

type ParseError = {
    message: string,
    index: number,
}

export type Token = {
    type: TokenType,
    index: number,
    value: Literal | undefined,
}

type Literal = number | string;

// TODO: Change to arrays
type ScannerResult = Array<Token> | Array<Error>;

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
 * TEMPORARY
 * Checks if the result of a scan has errors
 * @param result The scan results
 * @returns True if there are any errors, false otherwise
 */
export function has_errors(result: ScannerResult): result is Array<Error> {
    if(result.length === 0) {
        return false;
    }
    const first = result[0];
    return (first as Error).message !== undefined;
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
    // Emits a parse error
    function error(message: string) {
        scanner.errored = true;
        const error: ParseError = {
            message: message,
            index: scanner.index,
        };
        errors.push(error);
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
    function consume() {
        const value = peek();
        scanner.index += 1;
        return value;
    }

    // // Gets the entire line that's currently being scanned
    // function current_line(): string {
    //     // Safety: We only increment line_number when finding a \n, 
    //     // so splitting by \n then indexing by line_number will always be defined
    //     return scanner.input.split("\n")[scanner.line_number]!;
    // }

    // Scan a floating point number, emitting an error on faulty syntax
    function scan_number(): Token | null {
        const start = scanner.index;
        while(is_digit(peek())) {
            consume();
        }
        if(peek() === ".") {
            if (!is_digit(peek(1))) {
                consume();
                error("Invalid number literal. Expected digit after '.', got '" + peek() + "'!");
                skip_line = true;
                return null;
            }
            consume();
        }
        while(is_digit(peek())) {
            consume();
        }

        return token(
            start,
            TokenType.NUMBER_LIT, 
            Number(scanner.input.substring(start, scanner.index))
        );
    }

    let scanner = scanner_init(input);
    let output: Array<Token> = [];
    let errors: Array<Error> = [];
    let skip_line = false;

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
            consume();
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
            case "+":
                output.push(make_token(TokenType.PLUS));
                break;
            case "\n":
                break;
            case "-":
                output.push(make_token(TokenType.MINUS));
                break;
            case "*":
                output.push(make_token(TokenType.TIMES));
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
            default:
                if (is_whitespace(ch)) { 
                    break;
                } else if (is_digit(ch)) {
                    const n = scan_number();
                    if (n !== null) {
                        output.push(n);
                    }
                    continue; // The number scanning already advances to the right position
                } else {
                    error("Unrecognized character '" + ch + "'!");
                    skip_line = true;
                }
                break;
        }
        consume();
    }
}

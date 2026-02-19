// import { Value } from "../lib/types";
import { List, list, append as append_list, head } from "../lib/list";

export enum TokenType {
    PLUS,
    MINUS,
    TIMES,
    DIVIDE,
    NUMBER_LIT,
    EOF,
}

// Temporary error handling
interface Error {
    message: string,
    line: string,
    line_number: number,
    line_index: number,
}

type ParseError = {
    message: string,
    line: string,
    line_number: number,
    line_index: number,
}

export type Token = TokenType | ValueToken;
type Value = number | string;


type ValueToken = {
    type: TokenType,
    value: Value | null,
}

type ScannerResult = List<Token> | List<Error>;

// A string with length 1
type Character = string; 

// State information for the scanner
type Scanner = {
    errored: boolean;
    input: string;
    input_length: number;
    output: List<Token>;
    line_number: number;
    line_index: number;
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
        output: list(),
        line_number: 0,
        line_index: 0,
        index: 0,
    }
}

/**
 * TEMPORARY
 * Checks if the result of a scan has errors
 * @param result The scan results
 * @returns True if there are any errors, false otherwise
 */
export function has_errors(result: ScannerResult): boolean {
    if(result === null) {
        return false;
    }
    const first = head<Token | Error, List<Token> | List<Error>>(result);
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
            line: current_line(),
            line_number: scanner.line_number,
            line_index: scanner.line_index,
        };
        errors = append(errors, error);
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
        scanner.line_index += 1;
        return value;
    }

    // Gets the entire line that's currently being scanned
    function current_line(): string {
        // Safety: We only increment line_number when finding a \n, 
        // so splitting by \n then indexing by line_number will always be defined
        return scanner.input.split("\n")[scanner.line_number]!;
    }

    // Scan a floating point number, emitting an error on faulty syntax
    function scan_number(): Token | null {
        const start = scanner.index;
        while(is_digit(peek())) {
            consume();
        }
        if(peek() === ".") {
            if (!is_digit(peek(1))) {
                error("Expected digit after '.', got '" + peek(1) + "'!");
                skip_line = true;
                return null;
            }
            consume();
        }
        while(is_digit(peek())) {
            consume();
        }
        return {
            type: TokenType.NUMBER_LIT,
            value: Number(scanner.input.substring(start, scanner.index)),
        };
    }

    // Appends an element to the end of a List
    function append<T>(ls: List<T>, element: T): List<T> {
        return append_list(ls, list(element));
    }

    let scanner = scanner_init(input);
    let output = list<Token>();
    let errors = list<Error>();
    let skip_line = false;

    while(true) {
        const ch = peek();
        // If we encounter an error during parsing, skip the rest of the line to not spam errors on every character afterwards
        if (skip_line) {
            if (ch === "\0") {
                return !scanner.errored
                    ? append(output, TokenType.EOF)
                    : errors;
            } else if (ch === "\n") {
                skip_line = false;
                scanner.line_index = 0;
                scanner.line_number += 1;
            }
            consume();
            continue;
        }
        switch (ch) {
            case "\0":
                return !scanner.errored
                    ? append(output, TokenType.EOF)
                    : errors;
            case "\n":
                scanner.line_index = 0;
                scanner.line_number += 1;
                break;
            case "+":
                output = append(output, TokenType.PLUS);
                break;
            case "-":
                output = append(output, TokenType.MINUS);
                break;
            case "*":
                output = append(output, TokenType.TIMES);
                break;
            case "/":
                output = append(output, TokenType.DIVIDE);
                break;
            default:
                if (is_whitespace(ch)) { 
                    break;
                } else if (is_digit(ch)) {
                    const n = scan_number();
                    if (n !== null) {
                        output = append(output, n);
                    }
                } else {
                    error("Unrecognized character '" + ch + "'!");
                }
                break;
        }
        consume();
    }
}

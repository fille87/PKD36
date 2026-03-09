import { Token, token_length } from "./scanner";

export class UntypedscriptError extends Error {
    kind: ErrorKind;
    index: number;
    length?: number;

    /**
     * Constructor for an error message with no token length information
     * @param kind The type of error
     * @param message Error message to be displayed together with the source code
     * @param index The character of the source code where the error occurred
     */
    constructor(kind: ErrorKind, message: string, index: number) {
        super(message);

        this.kind = kind;
        this.index = index;
    }
}

/**
 * Constructs an error with information about how long the token that caused the token is
 * @param kind The type of error
 * @param message Error message to be displayed together with the source code
 * @param index The character of the source code where the error occurred, indexed from the start (will be pointed to in the error message)
 * @param length How many characters long the token where the error occurred is
 * @precondition index is a valid index into the source code string
 * @precondition length is an integer 1 or greater
 * @returns A new UntypescriptError with length information
 */
export function error_with_length(kind: ErrorKind, message: string, index: number, length: number) {
    const e = new UntypedscriptError(kind, message, index);
    e.length = length;
    return e;
}

/**
 * Constructs an error with information about the token that caused the error
 * @param kind The type of error
 * @param message Error message to be displayed together with the source code
 * @param token The token that caused the error (will be pointed to in the error message)
 * @returns A new UntypescriptError with token information
 */
export function error_with_token(kind: ErrorKind, message: string, token: Token) {
    const e = new UntypedscriptError(kind, message, token.index);
    e.length = token_length(token);
    return e;
}

// The different supported error types
export enum ErrorKind {
    ParseError,
    SyntaxError,
    UnexpectedToken,
    InvalidAssignment,
    MissingToken,
    RuntimeError,
    UndeclaredIdentifier,
}

// Internal representation of a line of source code
type Line = {
    source: string,
    line_number: number,
    start_index: number,
}

/**
 * Checks if something is an array of UntypescriptErrors
 * @param result What to check
 * @returns True if it's an array of UntypescriptErrprs, false otherwise
 */
export function has_errors<T>(e: T | Array<UntypedscriptError>): e is Array<UntypedscriptError> {
    if (!Array.isArray(e)) {
        return false;
    }
    if(e.length === 0) {
        return false;
    }
    return e.every((element) => is_error(element));
}

/**
 * Checks if something is an UntypescriptError
 * @param x What to check
 * @returns True if it's an UntypescriptError, false otherwise
 */
export function is_error<T>(x: T | UntypedscriptError): x is UntypedscriptError {
    const e = x as UntypedscriptError;
    return e.kind != undefined 
        && e.message != undefined 
        && e.index != undefined;
}

/**
 * Initiate the error display handler
 * @param source The source of the program
 * @returns A function that formats and prints an Array of UntypescriptErrors to the console
 */
export function init(source: string): (es: Array<UntypedscriptError>) => void {
    // Gets the corresponding line of source code for a character index
    function get_line(ch_index: number): Line | undefined {
        const lines = source.split("\n");
        let line_start = 0;

        for (let i = 0; i < lines.length; i += 1) {
            const line_end = line_start + lines[i].length;
            if (line_start <= ch_index && (line_end >= ch_index || (ch_index >= line_end && i === lines.length - 1))) {
                return {
                    source: lines[i],
                    line_number: i,
                    start_index: line_start,
                };
            }
            line_start = line_end + 1;
        }
    }

    // Makes a line containing a pointer to a specified location and length
    function make_pointer(line: Line, index: number, length?: number): string {
        const position = index - line.start_index;
        return "".padStart(position, " ") + "^".repeat(length === undefined ? 1 : length) + " Here";
    }

    // Displays an array of UntypescriptErrors to the user
    function display_errors(es: Array<UntypedscriptError>) {
        for (let i = 0; i < es.length; i += 1) {
            display_error(es[i]);
        }
    }

    // Displays a single UntypescriptError to the user
    function display_error(e: UntypedscriptError) {
        const line = get_line(e.index);
        if (line === undefined) {
            console.log("Error: " + e.message);
            return;
        }
        const lines = source.split("\n");
        const previous = lines[line.line_number - 1];
        const next = lines[line.line_number + 1];

        const margin_width = (line.line_number + 1).toString().length + 2; // One trailing space plus |
        const indentation = " ".repeat(4);
        const margin = (s: string) => s + "|".padStart(margin_width - s.toString().length) + indentation;

        console.log("Error: " + e.message);
        if (previous != undefined && previous.length != 0) {
            console.log(margin((line.line_number - 1).toString()) + previous);
        }
        console.log(line.line_number.toString() + " |" + indentation + line.source);
        console.log(margin("") + make_pointer(line, e.index, e.length))
        if (next != undefined && next.length != 0) {
            console.log(margin((line.line_number + 1).toString()) + next);
        }
        console.log();
    }

    return (es: Array<UntypedscriptError>) => display_errors(es);
}

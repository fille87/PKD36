import { Token, token_length, TokenType } from "./scanner";
import { get_sign } from "../lib/types";

export class UntypescriptError extends Error {
    kind: ErrorKind;
    index: number;
    length?: number;

    constructor(kind: ErrorKind, message: string, index: number) {
        super(message);

        this.kind = kind;
        this.index = index;

        //apparently extending built-ins like error the prototype chain can break
        //meaning at runtime js handles this class as if it was Error and not UntypescriptError.
        //This line slow (or so i've read) but it forces js to recognize UntypescriptError.
        Object.setPrototypeOf(this, UntypescriptError.prototype);
    }
}

export function error_with_length(kind: ErrorKind, message: string, index: number, length: number) {
    const e = new UntypescriptError(kind, message, index);
    e.length = length;
    return e;
}

export function error_with_token(kind: ErrorKind, message: string, token: Token) {
    const e = new UntypescriptError(kind, message, token.index);
    e.length = token_length(token);
    return e;
}

export function syntax_error(message: string, token: Token) {
    const e = new UntypescriptError(ErrorKind.SyntaxError, message, token.index);
    e.length = length;
    return e;
}

export enum ErrorKind {
    ParseError,
    SyntaxError,
    UnexpectedToken,
    InvalidAssignment,
    MissingToken,
    RuntimeError,
    UndeclaredIdentifier,
}

type Line = {
    source: string,
    line_number: number,
    start_index: number,
}

/**
 * Checks if an array is an array of Errors
 * @param result The array to check
 * @returns True if there are any errors, false otherwise
 */
export function has_errors<T>(ts: Array<T> | Array<UntypescriptError>): ts is Array<UntypescriptError> {
    if(ts.length === 0) {
        return false;
    }
    const first = ts[0];
    return is_error(first);
}

export function is_error<T>(x: T | UntypescriptError): x is UntypescriptError {
    const e = x as UntypescriptError;
    return e.kind != undefined 
        && e.message != undefined 
        && e.index != undefined;
}


export function init(source: string): (es: Array<UntypescriptError>) => void {
    function get_line(index: number): Line | undefined {
        const lines = source.split("\n");
        let line_start = 0;

        for (let i = 0; i < lines.length; i += 1) {
            const line_end = line_start + lines[i].length;
            if (line_start <= index && (line_end >= index || (index >= line_end && i === lines.length - 1))) {
                return {
                    source: lines[i],
                    line_number: i,
                    start_index: line_start,
                };
            }
            line_start = line_end + 1;
        }
    }

    function make_pointer(line: Line, index: number, length?: number): string {
        const position = index - line.start_index;
        return "".padStart(position, " ") + "^".repeat(length === undefined ? 1 : length) + " Here";
    }

    function display_errors(es: Array<UntypescriptError>) {
        for (let i = 0; i < es.length; i += 1) {
            display_error(es[i]);
        }
    }

    function display_error(e: UntypescriptError) {
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


    return (es: Array<UntypescriptError>) => display_errors(es);
}

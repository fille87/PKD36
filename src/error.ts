// export type UntypescriptError = {
//     kind: ErrorKind,
//     message: string,
//     index: number,
// }

export class UntypescriptError extends Error {
    kind: ErrorKind;
    index: number;

    constructor(kind: ErrorKind, message: string, index: number) {
        super(message);
        this.kind = kind;
        this.index = index;
    }
}

export enum ErrorKind {
    ParseError,
    SyntaxError,
    UnexpectedToken,
    InvalidAssignment,
    MissingToken
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
    // return is_error(first);
    return first instanceof UntypescriptError;
}

// export function is_error<T>(x: T | UntypescriptError): x is UntypescriptError {
//     // const e = x ins UntypescriptError;
//     // return e.kind != undefined 
//     //     && e.message != undefined 
//     //     && e.index != undefined;
// }


export function init(source: string): (es: Array<UntypescriptError>) => void {
    function get_line(index: number): Line | undefined {
        const lines = source.split("\n");
        let line_start = 0;

        for (let i = 0; i < lines.length; i += 1) {
            const line_end = line_start + lines[i].length;
            if (line_start <= index && line_end >= index) {
                return {
                    source: lines[i],
                    line_number: i,
                    start_index: line_start,
                };
            }
            line_start = line_end + 1;
        }
    }

    function make_pointer(line: Line, index: number): string {
        const position = index - line.start_index;
        return "".padStart(position, " ") + "^ Here";
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

        const margin_width = line.line_number.toString().length + 2; // One trailing space plus |
        const indentation = " ".repeat(4);
        const margin = "|".padStart(margin_width) + indentation;

        console.log("Error: " + e.message);
        console.log(line.line_number.toString() + " |" + indentation + line.source);
        console.log(margin + make_pointer(line, e.index))
        console.log();
    }


    return (es: Array<UntypescriptError>) => display_errors(es);
}

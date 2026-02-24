export interface Error {
    message: string,
    index: number,
}

type Line = {
    source: string,
    line_number: number,
    start_index: number,
}

const WIDTH_LIMIT = 100;

export function init(source: string): (es: Array<Error>) => void {
    function display_errors(es: Array<Error>) {
        for (let i = 0; i < es.length; i += 1) {
            display_error(es[i]);
        }
    }

    function display_error(e: Error) {
        const line = get_line(e.index);
        if (line === undefined) {
            console.log("Error: " + e.message);
            return;
        }

        const margin_width = line.line_number.toString().length + 2; // One trailing space plus |
        const indentation = " ".repeat(4);
        const margin = "|".padStart(margin_width) + indentation;

        console.log("Error: " + e.message);
        console.log(margin);
        console.log(line.line_number.toString() + " |" + indentation + line.source);
        console.log(margin + make_pointer(line, e.index))
        console.log();
    }

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
        // if (line.source.length > WIDTH_LIMIT && position >= 6) {
        //     out = "Here ---^".padStart(position, " ");
        // } else {
        //     out = "".padStart(position, " ") + "^" + "-".repeat(line.source.length - position - 1) + " Here";
        // }
        return "".padStart(position, " ") + "^ Here";
    }

    return (es: Array<Error>) => display_errors(es);
}

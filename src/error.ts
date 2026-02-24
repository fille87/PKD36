export interface Error {
    message: string,
    index: number,
}

type Line = {
    source: string,
    line_number: number,
    start_index: number,
}

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

        console.log("Error at line " + line.line_number + ": " + e.message);
        console.log(line.source);
        console.log(make_pointer(line, e.index))
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
        const out = "".padStart(position, " ") + "^" + "-".repeat(line.source.length - position - 1) + " Here";
        return out;
    }

    return (es: Array<Error>) => display_errors(es);
}

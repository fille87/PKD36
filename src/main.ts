import { readFileSync } from "fs";
import { exit, cwd } from "process";
import { interpret_source } from "./interpret_source";
import { resolve } from "path";
import { has_errors, init as error_display_init } from "./error";

const source_file = process.argv[2];
if (source_file === undefined) {
    console.log("No file specified");
    exit(1);
}

let source: string;
let path: string;

try {
    path = resolve(cwd(), source_file);
    source = readFileSync(path, "utf8");
} catch {
    console.log("Failed to open file '" + source_file + "'");
    exit(1);
}

const result = interpret_source(source);
if (has_errors(result)) {
    const display_errors = error_display_init(source);
    display_errors(result);
    exit(1);
}

exit(0);

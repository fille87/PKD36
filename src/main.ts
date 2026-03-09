import { readFileSync } from "fs";
import { exit } from "process";
import { interpret_source } from "./interpret_source";
import { resolve } from "path";
import { has_errors, init as error_display_init } from "./error";

const source_file = process.argv[2];
if (source_file === undefined) {
    console.log("No file specified");
    exit(1);
}

const path = resolve(__dirname, source_file);
let source: string;

try {
    source = readFileSync(path, "utf8");
} catch {
    console.log("Failed to open file '" + path + "'");
    exit(1);
}

const result = interpret_source(path, source);
if (has_errors(result)) {
    const display_errors = error_display_init(source);
    display_errors(result);
    exit(1);
}

exit(0);

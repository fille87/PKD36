import { readFileSync } from "fs";
import { init as error_display_init, has_errors, UntypescriptError } from "./error";
import { scan, Token } from "./scanner";
import { resolve, basename } from "path";
import { exit } from "process";
import { parse_tokens } from "./parser";
import { interpret, interpret_results } from "./interpreter";
import { Value } from "../lib/types";
import { interpret_source } from "./interpret_source";

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

interpret_source(path, source);

exit(0);

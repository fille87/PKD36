import { readFileSync } from "fs";
import { init as error_display_init, has_errors, UntypescriptError } from "./error";
import { scan, Token } from "./scanner";
import { resolve, basename } from "path";
import { exit } from "process";
import { parse_tokens } from "./parser";
import { interpret, interpret_results } from "./interpreter";

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

const display_errors = error_display_init(source);

const res = scan(source);

if (has_errors(res)){
    console.log("Could not parse source file '" + basename(path) + "'!\n");
    display_errors(res);
    exit(1);
}

const parsed = parse_tokens(res as Array<Token>);

if (has_errors(parsed)){
    console.log("Could not parse source file '" + basename(path) + "'!\n");
    display_errors(parsed);
    exit(1);
}


try {
    interpret_results(parsed);
} catch (e) {
    const error = e as UntypescriptError;
    display_errors([error]);
    exit(1);
}

exit(0);

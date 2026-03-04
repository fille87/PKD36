import { readFileSync } from "fs";
import { init as error_display_init, has_errors, UntypescriptError } from "./error";
import { scan, Token } from "./scanner";
import { resolve, basename } from "path";
import { exit } from "process";
import { parse_tokens } from "./parser";
import { interpret, interpret_results } from "./interpreter";
import { Value } from "../lib/types";

export function interpret_source(path: string, source: string): Value {
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
        return interpret_results(parsed);
    } catch (e) {
        const error = e as UntypescriptError;
        display_errors([error]);
        exit(1);
    }
}

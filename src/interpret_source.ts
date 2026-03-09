import { has_errors, UntypescriptError } from "./error";
import { scan, Token } from "./scanner";
import { parse_tokens } from "./parser";
import { interpret_results } from "./interpreter";
import { Value } from "../lib/types";

/**
 * Interpret a string of untypescript source code
 * @param source The source code to interpret
 * @returns The return value of the program if successful, 
 * otherwise returns all the encountered errors
 */
export function interpret_source(source: string): Value | Array<UntypescriptError> {
    const res = scan(source);
    if (has_errors(res)){
        return res;
    }

    const parsed = parse_tokens(res as Array<Token>);
    if (has_errors(parsed)){
        return parsed;
    }

    try {
        return interpret_results(parsed);
    } catch (e) {
        // Safety: We only ever intentionally throw UntypescriptErrors, 
        // and if some other error occurs something's gone very wrong and we should probably crash anyway
        const error = e as UntypescriptError;
        return [error];
    }
}

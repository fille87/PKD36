import { readFileSync } from "fs";
import { init as error_display_init } from "./error";
import { scan, has_errors } from "./scanner";
import { resolve } from "path";
import { exit } from "process";

const SOURCE_FILE = "../tests/source.txt";
const fileData: string = readFileSync(resolve(__dirname, SOURCE_FILE), "utf8");

const display_errors = error_display_init(fileData);

const res = scan(fileData);

if (has_errors(res)){
    console.log("Could not parse source file " + SOURCE_FILE + "!\n");
    display_errors(res);
    exit(1);
}

console.log(res);
exit(0);

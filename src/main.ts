import { readFileSync } from "fs";

const fileData: string = readFileSync("textfile.txt" //Replace with name of the text file
                                    , "utf8");

console.log(fileData);
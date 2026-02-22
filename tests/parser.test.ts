import { is_null, List, list, accumulate } from "../lib/list";
import { Parser, parse } from "../src/parser";
import {TokenType, Expression, Token, Binary} from "../lib/types";

// function list_to_arr<T>(lst: List<T>): T[]{
//     const out:T[] = []
//     if(is_null(lst)){
//         return [];
//     }
//     accumulate((item, index) => {
//         out[index] = item;
//         return index++;
//         }, 0, lst)
//     return out;
// }

// function test_helper(str:string){
//     const code: string = str;
//     const scan_result: List<Token> = scan(code) as List<Token>;
//     const tokens:Token[] = list_to_arr(scan_result)
//     return parse(tokens)
// }

test("parse 1+1", () => {
    const parser: Parser = parse([
        {type:TokenType.NUMBER_LIT, value:1},
        {type:TokenType.PLUS, value:"+"},
        {type:TokenType.NUMBER_LIT, value:1},
        {type:TokenType.EOF, value:"\0"}
    ]);
    const expexted = [{
        type: "Binary",
        operator: "+", 
        left: {type:"Literal", value: 1},
        right: {type:"Literal", value: 1}
    }]
    expect(parser.output[0]).toEqual(expexted[0]);
})

test("parse -1", () => {
    const parser: Parser = parse([
        {type:TokenType.MINUS, value:"-"},
        {type:TokenType.NUMBER_LIT, value:1},
        {type:TokenType.EOF, value:"\0"}
    ]);
    const expexted = [{
        type: "Unary",
        operator: "-", 
        operand: {type:"Literal", value: 1},
    }]
    expect(parser.output[0]).toEqual(expexted[0]);
})

test("parse 2-1", () => {
    const parser: Parser = parse([
        {type:TokenType.NUMBER_LIT, value:2},
        {type:TokenType.PLUS, value:"-"},
        {type:TokenType.NUMBER_LIT, value:1},
        {type:TokenType.EOF, value:"\0"}
    ]);
    const expexted = [{
        type: "Binary",
        operator: "-", 
        left: {type:"Literal", value: 2},
        right: {type:"Literal", value: 1}
    }]
    expect(parser.output[0]).toEqual(expexted[0]);
})

test("parse 1+(2*3)", () => {
    const parser: Parser = parse([
        {type:TokenType.NUMBER_LIT, value:1},
        {type:TokenType.PLUS, value:"+"},
        {type:TokenType.LEFT_PAREN, value:"("},
        {type:TokenType.NUMBER_LIT, value:2},
        {type:TokenType.TIMES, value:"*"},
        {type:TokenType.NUMBER_LIT, value:3},
        {type:TokenType.RIGHT_PAREN, value:")"},
        {type:TokenType.EOF, value:"\0"}
    ]);
    const expexted = [{
        type: "Binary",
        operator: "+", 
        left: {type:"Literal", value: 1},
        right: {
            type: "Binary",
            operator: "*", 
            left: {type:"Literal", value: 2},
            right: {type:"Literal", value: 3}
        }
    }]
    expect(parser.output[0]).toEqual(expexted[0]);
})
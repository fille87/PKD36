import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    TokenType, Token,
    Grouping,
    UnaOperator,
    BinOperator,
    get_sign
} from"../lib/types";

function parser_error(message: string): void{
    console.log("Parser ERROR: " + message + "\t At idk"); //TODO: add real error handling
}


export type Parser = {
    input: Token[],
    output: Expression[],
    has_error: boolean,
    current: number,
    end: number

}

export function parse(tokens: Token[]): Parser {
    const parser: Parser = {
        input: tokens,
        output: [],
        has_error: false,
        current: 0,
        end: tokens.length - 1
    }
    function error(message:string): void {
        parser.has_error = true;
        parser_error(message);
    }
    function at_end(): boolean{
        return peek().type === TokenType.EOF;
    }
    function check(type: TokenType): boolean { 
        return peek().type === type;
    }
    function previous(): Token {
        return parser.input[parser.current - 1];
    }
    //returns current
    function peek(): Token {
        return parser.input[parser.current];
    }
    //returns current and moves to next
    function advance(): Token{
        if(!at_end()) {
            parser.current++;
        }
        return previous();
    }

    function consume(token_type: TokenType, message: string): void{
        if(check(token_type)){
            advance();
        }
        error(message);
    }

    // comfirms type of token
    function match(...types: TokenType[]): boolean {
        for(let i = 0; i < types.length; i++) {
            if(check(types[i])){
                advance();
                return true;
            }
        }
        return false;
    }

    //TODO: Iplement recursive descent parsing
    function parse_expression(): Expression | null{
        const expr: Expression | null = parse_equality()
        return expr;
    }
    
    function parse_equality(): Expression| null {
        const equal: Expression | null = parse_comparison();
        return equal;
    }
    function parse_comparison(): Expression| null{
        const comp: Expression | null = parse_term();
        return comp;
    }
    function parse_term(): Expression| null{
        const term: Expression | null= parse_factor();
        while(match(TokenType.PLUS, TokenType.MINUS)){
            const operator: BinOperator = get_sign(previous()) as BinOperator
            const right: Expression | null = parse_factor();
            const index: number = peek().index;
            if(right === null || term === null){
                return null
            }
            return make_binary(operator, term, right, index);
        }
        return term;
    }
    function parse_factor(): Expression | null{
        const fact: Expression | null = parse_unary();
        while(match(TokenType.TIMES, TokenType.DIVIDE)){
            const operator: BinOperator = get_sign(previous()) as BinOperator;
            const right: Expression | null = parse_unary();
            const index: number = peek().index; 
            if(right === null || fact === null){
                return null
            }
            return make_binary(operator, fact, right, index)
        }
        return fact;
    }
    function parse_unary(): Expression | null{
        if(match(TokenType.MINUS)){
            const operator: UnaOperator = get_sign(previous()) as UnaOperator;
            const operand: Expression | null = parse_unary()
            const index: number = peek().index;
            if(operand === null){
                return null
            }
            return make_unary(operator, operand, index)
        }
        return parse_primary();
    }

    function parse_primary(): Expression | null{
        if(match(TokenType.NUMBER_LIT)) {
            const value: Value = get_sign(previous());
            const index: number = previous().index;
            return make_literal(value, index)
 
        }
        if(match(TokenType.LEFT_PAREN)) {
            const expr = parse_expression();
            consume(TokenType.RIGHT_PAREN, 'Expected ")" after expressionn, got:"' + get_sign(peek()) + '"')
            return expr;
        }
        error("Token not recognized");
        advance();
        return null
    }

    while(!at_end()) {
        const expr: Expression | null = parse_expression()
        if(expr === null){
            break;
        }
        parser.output.push(expr);
    }
    return parser;
}



function make_literal(value: Value, index: number): Literal {
    return {
        type: "Literal",
        index,
        value
    }
}

function make_unary(operator: UnaOperator, expr: Expression, index: number): Unary {
    return {
        type: "Unary",
        index,
        operator,
        operand: expr
    }
}

function make_binary(operator: BinOperator, left: Expression, 
                                right: Expression, index: number): Binary {
    return {
        type: "Binary",
        index,
        operator,
        left,
        right,
    }
}
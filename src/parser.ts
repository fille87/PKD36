import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    TokenType, Token,
    Grouping,
    UnaOperator,
    BinOperator

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
    function parse_expression(): Expression{
        const expr: Expression = parse_equality()
        return expr;
    }
    function parse_equality(): Expression{
        const equal: Expression = parse_comparison();
        return equal;
    }
    function parse_comparison(): Expression{
        const comp: Expression = parse_term();
        return comp;
    }
    function parse_term(): Expression{
        const term: Expression = parse_factor();
        while(match(TokenType.PLUS)){
            const operator: BinOperator = previous().value as BinOperator
            const right: Expression = parse_factor();
            return make_binary(operator, term, right);
        }
        return term;
    }
    function parse_factor(): Expression{
        const fact: Expression = parse_unary();
        while(match(TokenType.TIMES, TokenType.DIVIDE)){
            const operator: BinOperator = previous().value as BinOperator;
            const right: Expression = parse_unary();
            return make_binary(operator, fact, right)
        }
        return fact;
    }
    function parse_unary(): Expression{
        if(match(TokenType.MINUS)){
            const operator: UnaOperator = previous().value as UnaOperator;
            const operand: Expression = parse_unary()
            return make_unary(operator, operand)
        }
        return parse_primary();
    }
    function parse_primary(): Expression{
        if(match(TokenType.NUMBER_LIT)) {
            return make_literal(previous().value)
 
        }
        if(match(TokenType.LEFT_PAREN)) {
            const expr = parse_expression();
            consume(TokenType.RIGHT_PAREN, 'Expected ")" after expressionn, got:"' + peek().value + '"')
            return expr;
        }
        error("Token not recognized");
        advance();
        return make_literal(null) // TODO: IDK if a literal shoould have null as value
    }

    while(!at_end()) {
        parser.output.push(parse_expression());
    }
    return parser;
}



function make_literal(value: Value): Literal {
    return {
        type: "Literal",
        value
    }
}

function make_unary(operator: UnaOperator, expr: Expression): Unary {
    return {
        type: "Unary",
        operator,
        operand: expr
    }
}

function make_binary(operator: BinOperator, left: Expression, 
                                right: Expression): Binary {
    return {
        type: "Binary",
        operator,
        left,
        right,
    }
}
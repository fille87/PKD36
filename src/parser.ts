import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    Grouping,
    UnaOperator,
    BinOperator,
    get_sign,
    Statement,
    Block,
    Break,
    Variable,
    ReturnStatement,
} from"../lib/types";
import {
    TokenType,
    Token,
    token_length,
} from "./scanner"
import {
    UntypescriptError,
    error_with_length,
    ErrorKind,
    has_errors,
    error_with_token,
} from "./error";

//class ParseError extends globalThis.Error {}


export type Parser = {
    latest_was_expression: boolean;
    input: Array<Token>,
    output: Array<Expression | Statement>,
    errors: Array<UntypescriptError>,
    has_error: boolean,
    current: number,
    end: number

}

export type ParserResult = Array<Expression | Statement> | Array<UntypescriptError>;

export function parse_tokens(tokens: Array<Token>): ParserResult {
    const parser = parse(tokens);
    if (has_errors(parser.errors)) {
        return parser.errors;
    }
    return parser.output;
}

export function parse(tokens: Array<Token>): Parser {
    const parser: Parser = {
        input: tokens,
        output: [],
        errors: [],
        has_error: false,
        current: 0,
        latest_was_expression: false,
        end: tokens.length - 1
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

    function consume(token_type: TokenType, message: string): Token{
        if(check(token_type)){
            return advance();
        }
        throw error_with_length(ErrorKind.MissingToken, message, peek().index, token_length(peek()));
    }

    // comfirms type of token
    function match(...types: Array<TokenType>): boolean {
        for(let i = 0; i < types.length; i++) {
            if(check(types[i])){
                advance();
                return true;
            }
        }
        return false;
    }

    function parse_statement(): Expression | Statement {
        if (parser.latest_was_expression) {
            // throw new UntypescriptError(ErrorKind.SyntaxError, "Expected ; after expression. Bare expressions must be the last line of a program or block", peek().index);
            throw error_with_token(ErrorKind.SyntaxError, "Expected ; after expression. Bare expressions must be the last line of a program or block", previous());
        }
        parser.latest_was_expression = false;
        if(match(TokenType.VAR)) return parse_var();
        if(match(TokenType.FN)) return parse_fn();
        if(match(TokenType.RETURN)) return parse_return();
        if(match(TokenType.PRINT)) return parse_print();
        if(match(TokenType.BREAK)) return parse_break();
        const expr = parse_expression();
        if (peek().type === TokenType.SEMICOLON) {
            advance();
            parser.latest_was_expression = false;
            return make_expression_statement(expr, expr.index);
        }
        switch (expr.type) {
            case "Block":
            case "While":
                break;
            default:
                parser.latest_was_expression = true;
        }
        return expr;
    }

    function parse_while(): Expression {
        const condition: Expression = parse_expression();
        let name : string | null = null // Must be a 
        if(match(TokenType.COLON)){
            name = get_sign(consume(
                    TokenType.IDENTIFIER, 
                    "Expected an identifier after :")) as string;
        }
        if(match(TokenType.LEFT_BRACE)){
            const body:Block = parse_block() as Block;
            body.label = name;
            return make_while(condition, body, name, peek().index)
        }
        throw error_with_token(ErrorKind.MissingToken, "Expected block after while", peek());
    }

    function parse_loop(): Expression {
        const index: number = peek().index;
        const condition: Expression = make_literal(true, index);
        let name : string | null = null
        if(match(TokenType.COLON)){
            name = get_sign(consume(
                    TokenType.IDENTIFIER, 
                    "Expected an identifier after :")) as string;
        }
        if(match(TokenType.LEFT_BRACE)){
            const body: Block = parse_block() as Block;
            return make_while(condition, body, name, index)
        }
        throw error_with_token(ErrorKind.MissingToken, "Expected block after while", peek());
    }

    function parse_break(): Statement {
        let index = peek().index;
        let label: string | null = null;
        let ret_val: Expression |null = null;
        if(match(TokenType.COLON)) {
            index = peek().index;
            label = get_sign(consume(TokenType.IDENTIFIER, "Expected an identifier after :")) as string;
        }
        if(match(TokenType.SEMICOLON)) {
            return {
                type: "Break",
                index,
                label,
                return_expr: null,
            };
        }
        if (match (TokenType.RETURN)) {
            ret_val = (parse_return() as ReturnStatement).expression;
            return {
                type: "Break",
                index,
                label,
                return_expr: ret_val,
            }
        }
        throw new UntypescriptError(ErrorKind.MissingToken, "Expected 'return', ';' or ':' after break", index);
    }

    function parse_print(): Statement {
        const index: number = previous().index;
        const expr: Expression = parse_expression();
        consume(TokenType.SEMICOLON, "Expected a ; at the end of print statement")
        return make_print(expr, index);
    }

    function parse_var(): Statement {
        const index: number = previous().index
        const name: string = consume(
                        TokenType.IDENTIFIER,
                        "Expected identifier after var").value as string
        let init: Expression | null = null;
        if(match(TokenType.EQUAL)){
            init = parse_expression();
        }
        consume(TokenType.SEMICOLON, "Expected a ; at the end of variable declaration");
        return make_var(name, init, index);
    }

    function parse_fn(): Statement{
        let index: number = previous().index;
        const name: string = get_sign(consume(
                TokenType.IDENTIFIER,
                "Expected an identifier in head of function declaration")) as string
        const parameters: Array<string> = []
        consume(TokenType.LEFT_PAREN, "Expect '(' after function name");
        if (!check(TokenType.RIGHT_PAREN)) {
            do {
                parameters.push(get_sign(consume(
                        TokenType.IDENTIFIER, 
                        "Expect parameter name."))as string);
                        
            } while (match(TokenType.COMMA));
        }
        consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");
        if(match(TokenType.LEFT_BRACE)) {
            const body: Block = parse_block() as Block;
            return make_fn(name, parameters, body, index);
        }

        throw error_with_token(ErrorKind.MissingToken, "Expected body after function head", peek());
    }

    function parse_return(): Statement {
        const index: number = previous().index;
        const expr: Expression = parse_expression();
        consume(TokenType.SEMICOLON, "Expected a ; at the end of the return statement");
        return make_return(expr, index);
    }

    function parse_expression(): Expression {
        if(match(TokenType.WHILE)) return parse_while();
        if(match(TokenType.LOOP)) return parse_loop();
        if(match(TokenType.LEFT_BRACE)) return parse_block();
        if(match(TokenType.IF)) return parse_if();
        const expr: Expression = parse_assignment();
        return expr;
    }

    function parse_if(): Expression {
        const index: number = previous().index;
        const condition: Expression = parse_expression();
        const if_then: Expression = parse_expression();
        let if_else: Expression | null = null
        if(match(TokenType.ELSE)){
            if_else = parse_expression();
        }
        return make_if(condition, if_then, if_else, index);
    }

    function parse_block(): Expression {
        const body: Array<Expression | Statement> = []
        parser.latest_was_expression = false;
        while (!check(TokenType.RIGHT_BRACE) && !at_end()) {
            // We need to catch errors inside of here so we can synchronize and exit the block gracefully
            try {
                body.push(parse_statement());
            } catch (e) {
                parser.has_error = true
                parser.latest_was_expression = false;
                parser.errors.push(e as UntypescriptError);
                synchronize();
            }
        }
        consume(TokenType.RIGHT_BRACE, "Expected } after block");
        parser.latest_was_expression = false;
        return make_block(body, previous().index)
    }

    function parse_assignment(): Expression {
        const target_token: Token = peek();
        let expr: Expression = parse_logic_or();
        if(match(TokenType.EQUAL)){
            const value: Expression = parse_expression();
            if(expr.type === "Variable") {
                return make_assignment(expr.name, value, expr.index);
            }
            throw error_with_token(ErrorKind.InvalidAssignment, "Invalid assignment target.", target_token);
        }
        return expr;
    }

    function parse_logic_or(): Expression {
        let expr: Expression = parse_logic_and();
        while(match(TokenType.OR)){
            const index: number = previous().index
            const right: Expression = parse_logic_and();
            expr = make_logic(expr, "or", right, index);
        }
        return expr;
    }
    function parse_logic_and(): Expression {
        let expr: Expression = parse_equality();
        while(match(TokenType.AND)){
            const index: number = previous().index
            const right: Expression = parse_equality();
            expr = make_logic(expr, "and", right, index);
        }
        return expr;
    }
    
    function parse_equality(): Expression {
        let equal: Expression = parse_comparison();
        while(match(TokenType.BANG_EQ, TokenType.DOUBLE_EQUAL)){
            const index: number = previous().index
            const operator: BinOperator = get_sign(previous()) as BinOperator;
            const right: Expression = parse_comparison();
            equal = make_binary(operator, equal, right, index);
        }
        return equal;
    }
    function parse_comparison(): Expression {
        let comp: Expression = parse_term();
        while(match(TokenType.LESS, TokenType.LESS_EQ,
                    TokenType.GREATER, TokenType.GREATER_EQ)) {
            const index: number = previous().index
            const operator: BinOperator = get_sign(previous()) as BinOperator;
            const right: Expression = parse_term();

            comp = make_binary(operator, comp, right, index);
        }
        return comp;
    }

    function parse_term(): Expression {
        let term: Expression = parse_factor(); // Left handside of the expression
        while(match(TokenType.PLUS, TokenType.MINUS)){ // If plus or minus
            const index = previous().index;
            const operator: BinOperator = get_sign(previous()) as BinOperator
            const right: Expression  = parse_factor(); // right hand side of the expression
            term = make_binary(operator, term, right, index); // make AST
        }
        return term;
    }

    function parse_factor(): Expression {
        let fact: Expression = parse_exponent(); // Left handside of the expression
        while(match(TokenType.TIMES, TokenType.DIVIDE)) { // If / or *
            const index: number = previous().index; 
            const operator: BinOperator = get_sign(previous()) as BinOperator;
            const right: Expression  = parse_exponent(); // right hand side of the expression
            fact = make_binary(operator, fact, right, index) // make AST
        }
        return fact;
    }
    
    function parse_exponent(): Expression {
        let base: Expression = parse_unary();
        while(match(TokenType.POW)) {
            const index: number = previous().index; 
            const operator: BinOperator = get_sign(previous()) as BinOperator;
            const exponent: Expression  = parse_unary();
            base = make_binary(operator, base, exponent, index)
        }
        return base;
    }

    function parse_unary(): Expression {
        if(match(TokenType.MINUS, TokenType.BANG)){
            const index: number = previous().index;
            const operator: UnaOperator = get_sign(previous()) as UnaOperator;
            const operand: Expression = parse_unary();
            return make_unary(operator, operand, index)
        }
        return parse_call();
    }

    function parse_call(): Expression {
        let expr: Expression = parse_primary();
        while (true) {
            if(match(TokenType.LEFT_PAREN)){
                if(expr.type !== "Variable"){
                    throw new UntypescriptError(
                        ErrorKind.UnexpectedToken,
                        "Call must be done on identifier",
                        expr.index)
                    }
                expr = finish_call(expr);
            } else {
                break
            }
        }

        return expr;
    }

    function finish_call(callee: Variable): Expression {
        const args: Array<Expression> = [];
        const index: number = previous().index
        if (!check(TokenType.RIGHT_PAREN)) {
            do {
                args.push(parse_expression())
            } while (match(TokenType.COMMA))
        }
        const token: Token = consume(TokenType.RIGHT_PAREN, "Expected ) after call")
        return make_call(callee, args, index)
    }

    function parse_primary(): Expression {
        const index: number = peek().index;
        if(match(TokenType.NULL)) return make_literal(null, index)
        if(match(TokenType.TRUE)) return make_literal(true, index)
        if(match(TokenType.FALSE)) return make_literal(false, index)
        if(match(TokenType.IDENTIFIER)) return make_variable(get_sign(previous()) as string, index)
        if(match(TokenType.NUMBER_LIT, TokenType.STRING_LIT)) {
            const value: Value = get_sign(previous());
            return make_literal(value, index)
        }
        if(match(TokenType.LEFT_PAREN)) {
            const expr = parse_expression();
            consume(TokenType.RIGHT_PAREN, 'Expected ")" after expression, got:"' + get_sign(peek()) + '"')
            return expr;
        }
        throw new UntypescriptError(ErrorKind.UnexpectedToken, "Expected an expression", index);
    }

    function synchronize(): void {
        parser.latest_was_expression = false;
        advance();

        while (!at_end()) {
            if (previous().type === TokenType.SEMICOLON) return;

            switch (peek().type) {
                case TokenType.FN:
                case TokenType.VAR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.RETURN:
                case TokenType.PRINT:
                case TokenType.PRINT:
                case TokenType.RIGHT_BRACE:
                    return;
            }

            advance();
        }
    }

    while (!at_end()) {
        try {
            const statement = parse_statement();
            parser.output.push(statement);
        } catch (e) {
            parser.has_error = true
            parser.latest_was_expression = false;
            parser.errors.push(e as UntypescriptError);
            synchronize();
        }
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

function make_print(expr: Expression, index: number): Statement {
    return {
        type: "Print",
        index,
        expression: expr,
    }
}

function make_var(name:string, initialiser: Expression | null, 
                                                index: number): Statement {
    return {
        type: "Variable_declaration",
        index,
        name,
        initialiser
    }
}

function make_fn(name:string, params:Array<string>, body: Block, index:number): Statement {
    return {
        type: "Function_declaration",
        index,
        name,
        params,
        body,
    }
}

function make_return(expression: Expression, index: number): Statement {
    return {
    type: "Return",
    index,
    expression,
}
}

function make_variable(name: string, index: number): Expression {
    return {
        type: "Variable", 
        index,
        name
    }
}

function make_assignment(name: string, value: Expression, index: number): Expression {
    return {
        type: "Assignment",
        index,
        name,
        value,
    }
}

function make_block(body: Array<Expression | Statement>, index: number): Expression {
    return {
    type: "Block",
    label: null, // TODO: Add support for labels
    index,
    body
    }
}

function make_expression_statement(expression:Expression, index: number): Statement {
    return {
        type: "Expression_statement",
        index,
        expression,
    }
}

function make_if(condition: Expression, if_then:Expression, if_else:Expression | null, index:number): Expression {
    return {
        type: "If",
        index,
        condition,
        if_then,
        if_else
    }
}

function make_logic(right:Expression, operator: "or" | "and", left:Expression, index:number): Expression {
    return {
        type: "Logic",
        index,
        right,
        operator,
        left
    }
}

function make_while(condition: Expression, body: Block, name: string | null, index: number): Expression {
    return {
        type: "While",
        index,
        condition,
        name,
        body,
    }
}

function make_call(callee:Variable, args:Array<Expression>, index:number): Expression {
    return {
        type: "Call",
        index,
        callee,
        args
    }
}

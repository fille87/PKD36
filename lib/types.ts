export type BinOperator = "+" | "-" | "*" | "/";
export type UnaOperator = "-"
export type Operator = BinOperator | UnaOperator
export type Value = number | string | boolean | null;


//tokens:
export enum TokenType {
    PLUS,
    MINUS,
    TIMES,
    DIVIDE,
    NUMBER_LIT,
    SEMICOLON,
    LEFT_PAREN,
    RIGHT_PAREN,
    EOF,
}

/*export type Token = ValueToken | TokenType
export type SignToken = {
    type: TokenType,
    sign: string 
}
export type ValueToken = {
    type: TokenType,
    value: Value, // Value | null
}
*/
export type Token = {
    type: TokenType,
    index: number,
    value: Value | undefined, // Value | null
}




//AST:

export type Operation = Unary | Binary;


export type Expression = Literal | Unary | Binary | Grouping;
export type Statement = Declaration | Assignment | ReturnStatement;
export type Component = Expression | Statement

export type Literal = {
    type: "Literal",
    index: number,
    value: Value
}
export type Unary = {
    type: "Unary",
    index: number,
    operator: UnaOperator;
    operand: Expression;
};
export type Binary = {
    type: "Binary",
    index: number,
    operator: BinOperator;
    left: Expression;
    right: Expression;
};
export type Grouping = {
    type: "Grouping",
    expresion: Expression
}


export function get_sign(token: Token): Value {
    switch(token.type){
        case TokenType.PLUS: return "+";
        case TokenType.MINUS: return "";
        case TokenType.TIMES: return "";
        case TokenType.DIVIDE: return "";
        case TokenType.NUMBER_LIT: return token.value as Value;
        case TokenType.LEFT_PAREN: return "(";
        case TokenType.RIGHT_PAREN: return ")";
        case TokenType.SEMICOLON: return ";";
        case TokenType.EOF: return "\0";
    }
}
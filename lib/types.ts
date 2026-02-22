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
    value: Value, // Value | null
}




//AST:

export type Operation = Unary | Binary;


export type Expression = Literal | Unary | Binary | Grouping;

export type Literal = {
    type: "Literal",
    value: Value
}
export type Unary = {
    type: "Unary"
    operator: UnaOperator;
    operand: Expression;
};
export type Binary = {
    type: "Binary"
    operator: BinOperator;
    left: Expression;
    right: Expression;
};
export type Grouping = {
    type: "Grouping",
    expresion: Expression
}



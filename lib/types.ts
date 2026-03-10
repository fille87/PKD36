import { ProbingHashtable } from "./hashtables";
import { NonEmptyStack } from "./stack";
import { Token, TokenType } from "../src/scanner"

export type BinOperator = "+" | "-" | "*" | "/" | "==" | "!=" 
                          | "<=" | ">=" | "<" | ">" | "**";
export type UnaOperator = "-" | "!";
export type Operator = BinOperator | UnaOperator;
export type Value = number | string | boolean | null;

export type Frame = {
    label: string | null,
    vars: ProbingHashtable<string, Binding>;
}
export type Environment = NonEmptyStack<Frame>;
export type Binding = VariableBinding | Array<FunctionBinding> | Uninitialized;

export type VariableBinding = {
    type: "Variable_Binding",
    value: Value,
}

export type Uninitialized = {
    type: "Uninitialized",
}

export type FunctionBinding = {
    type: "Function_Binding",
    params: Array<string>,
    body: Block,
}


//AST:

export type Operation = Unary | Binary;

export type Expression = Literal | Unary | Binary | Block | Variable 
                         | Assignment | If | Logic | Call | While;
export type Statement = Declaration | ReturnStatement | Print 
                        | ExpressionStatement | Break;

export type Declaration = VariableDec | FunctionDec


export type VariableDec = {
    type: "Variable_declaration",
    index: number,
    identifier_index: number,
    name: string,
    initialiser: Expression | null,
}
export type FunctionDec = {
    type: "Function_declaration",
    index: number,
    name: string,
    params: Array<string>,
    body: Block,
}

export type Call = {
        type: "Call",
        index: number,
        callee: Variable,
        args: Array<Expression>
    }

export type Break = {
        type: "Break",
        index: number,
        label: string | null,
        return_expr: Expression | null,
    }

export type While = {
    type: "While",
    index: number,
    condition: Expression,
    name: string | null,
    body: Block,
}

export type ExpressionStatement = {
    type: "Expression_statement",
    index: number,
    expression: Expression,
}

export type If = {
        type: "If",
        index: number,
        condition: Expression,
        if_then: Expression,
        if_else: Expression | null
}



export type Logic= {
    type: "Logic"
    index: number,
    left: Expression,
    operator: "and" | "or",
    right: Expression,
}


export type ReturnStatement = {
    type: "Return",
    index: number,
    expression: Expression,
}

export type Assignment = {
    type: "Assignment",
    index: number,
    name: string,
    value: Expression,
}

export type Variable = {
    type: "Variable",
    index: number,
    name: string,
}

export type Block = {
    type: "Block",
    index: number,
    label: string | null,
    body: Array<Expression | Statement>
}
export type Print = {
    type: "Print",
    index: number,
    expression: Expression,
}

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


export function get_sign(token: Token): Value {
    switch (token.type) {
        // Arithmetic operators
        case TokenType.PLUS: return "+";
        case TokenType.MINUS: return "-";
        case TokenType.TIMES: return "*";
        case TokenType.DIVIDE: return "/";
        case TokenType.POW: return "**";

        // Literals
        case TokenType.NUMBER_LIT: 
        case TokenType.STRING_LIT:
        case TokenType.IDENTIFIER:
            return token.value as Value;

        // Delimiters
        case TokenType.LEFT_PAREN: return "(";
        case TokenType.RIGHT_PAREN: return ")";
        case TokenType.LEFT_BRACE: return "{";
        case TokenType.RIGHT_BRACE: return "}";
        case TokenType.SEMICOLON: return ";";

        // One or two character tokens
        case TokenType.BANG: return "!";
        case TokenType.BANG_EQ: return "!=";
        case TokenType.EQUAL: return "=";
        case TokenType.DOUBLE_EQUAL: return "==";
        case TokenType.GREATER: return ">";
        case TokenType.GREATER_EQ: return ">=";
        case TokenType.LESS: return "<";
        case TokenType.LESS_EQ: return "<=";

        // Keywords
        case TokenType.AND: return "and";
        case TokenType.ELSE: return "else";
        case TokenType.FALSE: return "false";
        case TokenType.FN: return "fn";
        case TokenType.IF: return "if";
        case TokenType.NULL: return "null";
        case TokenType.OR: return "or";
        case TokenType.PRINT: return "print";
        case TokenType.RETURN: return "return";
        case TokenType.TRUE: return "true";
        case TokenType.VAR: return "var";
        case TokenType.WHILE: return "while";
        case TokenType.LOOP: return "loop";

        case TokenType.EOF: 
            return "\0";

        default:
            throw new Error(`Unhandled token type: ${token.type}`);
    }
}

import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    Grouping,
    UnaOperator,
    BinOperator,
    Statement,
    get_sign,
    Block,
    Assignment,
    VariableDec,
    Declaration,
    FunctionDec
} from"../lib/types";

import {
    Token,
    TokenType
} from "./scanner";

import {
    UntypescriptError,
    ErrorKind
} from "./error";
import { ch_empty, ch_insert, ch_lookup, ChainingHashtable } from "../lib/hashtables";

// let hadRuntimeError: boolean = false;

// function runtimeError(RunError: string) {
//     // console.log(RunError.getMessage() +
//     //     "\n[line " + RunError.token.line + "]");
//     hadRuntimeError = true;
//     throw new
//   }
//
const GLOBALS: ChainingHashtable<string, Expression> = ch_empty(100, (str) => str.charCodeAt(0));

export function interpret_results(res: Array<Statement>) {
    for (let i = 0; i < res.length; i += 1) {
        interpret(res[i]);
    }
}

// Runs the interpreter
export function interpret(expr: Statement): Value | null { 
    switch (expr.type) {
        case "Return":
            return evaluate(expr.expression);
        case "Print":
            console.log(evaluate(expr.expression));
            return null;
        case "Expression_statement":
            return evaluate(expr.expression);
        // TODO
        case "While":
        case "Variable_declaration":
            declare(expr as Declaration);
        case "Function_declaration":
        default:
            return null;
    }
}

// Evaluates the given expression
function evaluate(expr: Expression): Value {
    switch (expr.type) {
        case "Literal":
            return literalExpr(expr);
        case "Grouping":
            return groupingExpr(expr);
        case "Unary":
            return unaryExpr(expr);
        case "Binary":
            return binaryExpr(expr);
        case "Block":
            return block(expr);
        case "Variable":
            if (var_lookup(expr.name) !== undefined) {
                return evaluate(var_lookup(expr.name)!);
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, "'" + expr.name + "' is not defined", expr.index);
    }
    return null; //seems neccesary but have to check
    //return expr.accept.this//Can't get this to work
}

// Returns the value of the literal expression
function literalExpr(expr: Literal): Value {
    return expr.value;
}

// Evaluates the expression within parentheses
function groupingExpr(expr: Grouping) {
    return evaluate(expr.expresion);
}

// Evaluates the operand and returns the complete unary expression
function unaryExpr(expr: Unary) {
    const operand: Value = evaluate(expr.operand);
    
    switch (expr.operator) {
        case "!":
            return !isTruthy(operand);
        case "-":
            checkNumberOperand(expr);
            return -Number(operand);
    }
    return null;
}

// Checks if the operand is a number
function checkNumberOperand(expr: Unary) {
    if (Object(expr.operand) instanceof Number) return;
    throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " Operand must be a number.", expr.index); //Change to connect to error module
}

// Checks if the operands are numbers
function checkNumberOperands(expr: Binary) {
    if (Object(expr.left) instanceof Number && Object(expr.right) instanceof Number) return;
    throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " Operands must be numbers.", expr.index); //Change to connect to error module
}

// Returns true for all value type Value, except for "null" and "false"
function isTruthy(value: Value): boolean {
    if (value == null) return false;
    if (Object(value) instanceof Boolean) return Boolean(value);
    return true;
}

// Returns true if the values a and b are equal
function isEqual(a: Value, b: Value): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return typeof a === typeof b
              ? a === b
                  ? true
                  : false
              : false;
}

// Converts value to type string
function stringify(value: Value): string {
    if (value == null) return "null";

    /* Don't know if this is neccesary for this implementation
    if (Object(value) instanceof Number) {
      let text: string = value.toString();
      if (text.endsWith(".0")) {
        text = text.substring(0, text.length - 2);
      }
      return text;
    }
    */

    return value.toString();
}

// Evaluates the left and right sides of a binary expression and returns the result of using the operator with the values
function binaryExpr(expr: Binary) {
    const left: Value | null = evaluate(expr.left);
    const right: Value | null = evaluate(expr.right); 
    if (left === null || right === null) {
        throw new UntypescriptError(ErrorKind.RuntimeError, "Expected expression to the " + left === null ? "left" : "right" + " of '" + expr.operator + "'", expr.left.index);
    }

    switch (expr.operator) {
        case ">":
            if (typeof left === "number" && typeof right === "number") {
                return left > right;
            }
        case ">=":
            if (typeof left === "number" && typeof right === "number") {
                return left >= right;
            }
        case "<":
            if (typeof left === "number" && typeof right === "number") {
                return left < right;
            }
        case "<=":
            if (typeof left === "number" && typeof right === "number") {
                return left <= right;
            }
        case "-":
            if (typeof left === "number" && typeof right === "number") {
                return left - right;
            }
        case "**":
            if (typeof left === "number" && typeof right === "number") {
                return Math.pow(left, right);
            }
        case "/":
            if (typeof left === "number" && typeof right === "number") {
                return left / right;
            }
            // Fall-through runtime error for operators that require two numbers
            throw new UntypescriptError(ErrorKind.RuntimeError, "Both operands of '" + expr.operator + "' must be numbers", expr.index);
        case "*":
            if (typeof left === "number" && typeof right === "number") {
                return left * right;
            } else if (typeof left === "string" && typeof right === "number") {
                return left.repeat(right);
            } else if (typeof left === "number" && typeof right === "string") {
                return right.repeat(left);
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be either two numbers or a number and a string", expr.index);
        case "+":
            // Typescript can't deduce that left and right are the same type, so we need two different if conditions
            if (typeof left === "number" && typeof right === "number") {
                return left + right;
            } else if (typeof left === "string" && typeof right === "string") {
                return left + right;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be two numbers or two strings.", expr.index);
        case "!=":
            return !isEqual(left, right);
        case "==":
            return isEqual(left, right);
    }

    // Unreachable.
    return null;
}

function block(block: Block): Value | null {
    let return_value: Value | null = null;
    for (let i = 0; i < block.body.length; i += 1) {
        return_value = interpret(block.body[i]);
    }
    return return_value;
}

function var_lookup(name: string): Expression | undefined {
    return ch_lookup(GLOBALS, name);
}

function declare(expr: Declaration) {
    switch(expr.type) {
        case "Variable_declaration":
            ch_insert(GLOBALS, expr.name, expr.initialiser);
        case "Function_declaration":
            // TODO
        break;
    }
}

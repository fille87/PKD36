import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    Grouping,
    UnaOperator,
    BinOperator,
    get_sign
} from"../lib/types";

import {
    Token,
    TokenType
} from "./scanner";

import {
    UntypescriptError,
    ErrorKind
} from "./error";

// let hadRuntimeError: boolean = false;

// function runtimeError(RunError: string) {
//     // console.log(RunError.getMessage() +
//     //     "\n[line " + RunError.token.line + "]");
//     hadRuntimeError = true;
//     throw new
//   }

// Runs the interpreter
export function interpret(expr: Expression): Value { 
    // try {
  const value: Value = evaluate(expr);
  return value;
    // } catch (error) {
    //     if(error instanceof UntypescriptError) {
    //         runtimeError(error);
    //     } else {
    //         throw error;
    //     }
    // }
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
    const left: Value = evaluate(expr.left);
    const right: Value = evaluate(expr.right); 

    switch (expr.operator) {
        case ">":
            checkNumberOperands(expr);
            return Number(left) > Number(right);
        case ">=":
            checkNumberOperands(expr);
            return Number(left) >= Number(right);
        case "<":
            checkNumberOperands(expr);
            return Number(left) < Number(right);
        case "<=":
            checkNumberOperands(expr);
            return Number(left) <= Number(right);
        case "!=":
            checkNumberOperands(expr);
            return !isEqual(left, right);
        case "==":
            checkNumberOperands(expr);
            return isEqual(left, right);
        case "-":
            checkNumberOperands(expr);
            return Number(left) - Number(right);
        case "+":
            if (Object(left) instanceof Number && Object(right) instanceof Number) {
                return Number(left) + Number(right);
            } 

            if (Object(left) instanceof String && Object(right) instanceof String) {
                return String(left) + String(right);
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " Operands must be two numbers or two strings.", expr.index);
        case "/":
            checkNumberOperands(expr);
            return Number(left) / Number(right);
        case "*":
            checkNumberOperands(expr);
            return Number(left) * Number(right);
    }

    // Unreachable.
    return null;
}

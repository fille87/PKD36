import {
    Expression, Literal, Unary, Binary, Operation, Operator, Value,
    TokenType, Token,
    Grouping,
    UnaOperator,
    BinOperator,
    get_sign
} from"../lib/types";

import {
    UntypescriptError
} from "./error";

let hadRuntimeError: boolean = false;

function runtimeError(RunError: string) {
    console.log(RunError.getMessage() +
        "\n[line " + RunError.token.line + "]");
    hadRuntimeError = true;
  }

// Runs the interpreter
function interpret(expr: Expression) { 
    try {
      const value: Value = evaluate(expr);
      console.log(stringify(value));
    } catch (error) {
        if(error instanceof UntypescriptError) {
            runtimeError(error);
        } else {
            throw error;
        }
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
            checkNumberOperand(expr.operator, operand);
            return -Number(operand);
    }
    return null;
}

// Checks if the operand is a number
function checkNumberOperand(operator: string, operand: Value) {
    if (Object(operand) instanceof Number) return;
    throw new RuntimeError(operator + " Operand must be a number."); //Change to connect to error module
}

// Checks if the operands are numbers
function checkNumberOperands(operator: string, left: Value, right: Value) {
    if (Object(left) instanceof Number && Object(right) instanceof Number) return;
    throw new RuntimeError(operator + " Operands must be numbers."); //Change to connect to error module
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
            checkNumberOperands(expr.operator, left, right);
            return Number(left) > Number(right);
        case ">=":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) >= Number(right);
        case "<":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) < Number(right);
        case "<=":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) <= Number(right);
        case "!=":
            checkNumberOperands(expr.operator, left, right);
            return !isEqual(left, right);
        case "==":
            checkNumberOperands(expr.operator, left, right);
            return isEqual(left, right);
        case "-":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) - Number(right);
        case "+":
            if (Object(left) instanceof Number && Object(right) instanceof Number) {
                return Number(left) + Number(right);
            } 

            if (Object(left) instanceof String && Object(right) instanceof String) {
                return String(left) + String(right);
            }
            throw new RuntimeError(expr.operator + " Operands must be two numbers or two strings."); //Change to connect to error module
        case "/":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) / Number(right);
        case "*":
            checkNumberOperands(expr.operator, left, right);
            return Number(left) * Number(right);
    }

    // Unreachable.
    return null;
}
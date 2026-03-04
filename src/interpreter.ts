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
    FunctionDec,
    Frame,
    Uninitialized,
    Binding,
    While,
    VariableBinding,
    Break,
    If
} from"../lib/types";

import {
    Token,
    TokenType
} from "./scanner";

import {
    UntypescriptError,
    ErrorKind,
    is_error
} from "./error";
import { ch_empty, ch_insert, ch_lookup, ChainingHashtable, ph_empty, ph_insert, ph_keys, ph_lookup, ProbingHashtable } from "../lib/hashtables";
import { Stack, empty as empty_stack, push, top, pop, NonEmptyStack, is_empty, display_stack } from "../lib/stack";

// let hadRuntimeError: boolean = false;

// function runtimeError(RunError: string) {
//     // console.log(RunError.getMessage() +
//     //     "\n[line " + RunError.token.line + "]");
//     hadRuntimeError = true;
//     throw new
//   }
//
const DEFAULT_VARIABLE_SLOTS = 50;
const HASH_FUNCTION = (str: string) => str.charCodeAt(0);
const GLOBALS: Frame = empty_frame();
let frames: Stack<Frame> = push(GLOBALS, empty_stack());
let should_break: string | boolean = false;

export function interpret_results(res: Array<Expression>): Value {
    let ret_val: Value = null;
    for (let i = 0; i < res.length; i += 1) {
        ret_val = interpret(res[i]);
    }
    return ret_val;
}

// Runs the interpreter
export function interpret(expr: Expression): Value { 
    switch (expr.type) {
        case "Return":
            return interpret(expr.expression);
        case "Print":
            console.log(interpret(expr.expression));
            return null;
        case "Expression_statement":
            interpret(expr.expression);
            return null;
        case "Assignment":
            assign(expr);
            return null;
        case "Variable_declaration":
            declare(expr as Declaration);
            return null;
        case "Break":
            break_loop(expr as Break);
            return expr.return_expr != null
                ? interpret(expr.return_expr)
                : null;
        // TODO
        case "Function_declaration":
        default:
            return evaluate(expr);
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
        case "While":
            return loop(expr);
        case "Variable":
            return var_lookup(expr);
        case "If":
            return conditional(expr);
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
    enter_frame(null);
    for (let i = 0; i < block.body.length; i += 1) {
        return_value = interpret(block.body[i]);
        if (should_break != false) {
            break;
        }
    }
    exit_frame();
    return return_value;
}

function conditional(expr: If): Value | null {
    if(isTruthy(evaluate(expr.condition))) {
        return interpret(expr.if_then);
    }
    if (expr.if_else != null) {
        return interpret(expr.if_else);
    }
    return null;
}

function var_lookup(expr: {name: string, index: number}): Value {
    const error = new UntypescriptError(ErrorKind.RuntimeError, "Couldn't find variable '" + expr.name + "' in the current scope", expr.index);
    if (is_empty(frames)) {
        throw error;
    }
    let temp_stack = empty_stack<Frame>();
    let res: Binding | undefined;
    let frame: Frame;
    while(!is_empty(frames)) {
        // Safety: We've made sure frames is not empty
        frame = pop_frame()!;
        temp_stack = push(frame, temp_stack);
        res = ph_lookup(frame.vars, expr.name);
        if (res != undefined) {
            while(!is_empty(temp_stack)) {
                const temp = top(temp_stack);
                temp_stack = pop(temp_stack);
                push_frame(temp);
            }
            push_frame(frame);
            break;
        }
    }
    if (res === undefined) {
        throw error;
    }
    switch (res.type) {
        case "Variable_Binding":
            return res.value;
        case "Funtion_Binding":
            //TODO
            // return res.expression;
        case "Uninitialized":
            throw new UntypescriptError(ErrorKind.RuntimeError, "Can't access uninitialized variable '" + expr.name + "'", expr.index);
    }
}

function declare(expr: Declaration) {
    switch(expr.type) {
        case "Variable_declaration":
            let frame = pop_frame();
            if (frame === undefined) {
                frame = empty_frame();
            }
            // Put the frame back before evaluating the initialiser
            push_frame(frame);
            let val: Uninitialized | VariableBinding = expr.initialiser === null
                ? { type: "Uninitialized" }
                : { type: "Variable_Binding", value: evaluate(expr.initialiser) };
            // Safety: We just pushed a frame onto frames
            frame = pop_frame()!;
            ph_insert(frame.vars, expr.name, val);
            push_frame(frame);
        case "Function_declaration":
            // TODO
        break;
    }
}

function assign(expr: Assignment) {
    if (var_lookup(expr) === undefined) {
        throw new UntypescriptError(ErrorKind.RuntimeError, "Cannot assign to variable '" + expr.name + "' before it is declared", expr.index);
    }
    let frame: Frame;
    let temp_stack = empty_stack<Frame>();
    while (!is_empty(frames)) {
        // We know there's at least one frame since we already found the variable
        frame = pop_frame()!;
        if (ph_lookup(frame.vars, expr.name) != undefined) {
            // Put the frame back before we evaluate the expression
            push_frame(frame);
            const binding: VariableBinding = {
                type: "Variable_Binding",
                value: evaluate(expr.value),
            };
            // Safety: We just pushed this
            frame = pop_frame()!
            ph_insert(frame.vars, expr.name, binding);
            push_frame(frame);
            while(!is_empty(temp_stack)) {
                const temp = top(temp_stack);
                temp_stack = pop(temp_stack);
                push_frame(temp);
            }
            return;
        } else {
            temp_stack = push(frame, temp_stack);
        }
    }
}

// TODO: Implement break/continue
function loop(expr: While): Value | null {
    let return_value: Value | null = null;
    while(isTruthy(evaluate(expr.condition))) {
        return_value = interpret(expr.body);
        if (should_break != false) {
            if (is_empty(frames)) {
                should_break = false;
                return return_value;
            }
            const current_frame = pop_frame();
            // Safety: We check that frames isn't empty, which means frame isn't undefined
            if (should_break === true || should_break === current_frame!.label) {
                should_break = false;
            }
            return return_value;
        }
    }
    return return_value;
}

function pop_frame(): Frame | undefined {
    if (is_empty(frames)) {
        return undefined;
    } 
    const frame = top(frames);
    frames = pop(frames);
    return frame;
}

function push_frame(frame: Frame) {
    frames = push(frame, frames);
}

function enter_frame(label: string | null) {
    const frame: Frame = empty_frame();
    frame.label = label;
    push_frame(frame);
}

function exit_frame() {
    if (is_empty(frames)) {
        push_frame(empty_frame());
        return;
    }
    frames = pop(frames);

    if (is_empty(frames)) {
        push_frame(empty_frame());
    }
}

function empty_frame(): Frame {
    return {
        label: null,
        vars: ph_empty(DEFAULT_VARIABLE_SLOTS, HASH_FUNCTION),
    };
}

function break_loop(expr: Break) {
    should_break = expr.label != undefined ? expr.label : true;
}

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
    VariableBinding,
    Uninitialized,
    Binding,
    Environment,
    FunctionBinding,
    Identifier,
    Call
} from"../lib/types";

import {
    Token,
    TokenType
} from "./scanner";
import {
    make_var
} from "./parser"
import {
    UntypescriptError,
    ErrorKind
} from "./error";
import { ch_empty, ch_insert, 
    ch_lookup, ChainingHashtable, 
    ph_empty, ph_insert, ph_lookup, ProbingHashtable } from "../lib/hashtables";
import { Stack,top as st_top, empty as st_empty, push, pop as st_pop, push as st_push, is_empty, NonEmptyStack } from "../lib/stack";

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


export function interpret_results(res: Array<Statement>): void {
    const global_frame: Frame = get_natives();
    let env: Environment = push(global_frame, st_empty());
    env = get_functions(res, env);
    for (let i = 0; i < res.length; i += 1) {
        env = interpret(res[i], env)[1];
    }

}
function get_natives(): Frame {
    return new_frame()
}
function get_functions(res: Array<Statement>, env:Environment): Environment {
    env = st_push(new_frame(), env);
    for (let i = 0; i < res.length; i += 1) {
        if(res[i].type === "Function_declaration"){
            env = declare(res[i] as FunctionDec, env)
        }
    }
    return env
}
function new_frame(): Frame {
    return ph_empty(DEFAULT_VARIABLE_SLOTS, HASH_FUNCTION)
}
// Runs the interpreter
export function interpret(expr: Statement, env: Environment): [Value, Environment] { 
    let value: Value = null;
    switch (expr.type) {
        case "Return":
            return evaluate(expr.expression, env);
        case "Print":
            [value, env] = evaluate(expr.expression, env);
            console.log(value);
            return [value, env];
        case "Expression_statement":
            return evaluate(expr.expression, env);
        // TODO
        case "While":
        case "Variable_declaration":
                return [value, declare(expr as Declaration, env)];
        default:
            return [value, env];
    }
}

// Evaluates the given expression
function evaluate(expr: Expression, env:Environment): [Value, Environment] {
    // Variable changes the environment and returns a value
    // so evaluate must return both
    switch (expr.type) {
        case "Literal":
            return [literal_expr(expr), env];
        case "Grouping":
            return grouping_expr(expr, env);
        case "Unary":
            return unary_expr(expr, env);
        case "Binary":
            return binary_expr(expr, env);
        case "Block":
            return block(expr, env);
        case "Identifier":
            return [var_lookup(expr, env), env];
        case "Assignment":
            return assign_expr(expr, env);
        case "Call":
            return call_expr(expr, env);
        case "If":
        case "Logic":
            
    }
    return [null, env]; //seems neccesary but have to check
    //return expr.accept.this//Can't get this to work
}

// Returns the value of the literal expression
function literal_expr(expr: Literal): Value {
    return expr.value;
}

// Evaluates the expression within parentheses
// NOTE: Grouping does not exist as it seems to be unnecessary for NOW
function grouping_expr(expr: Grouping, env: Environment) {
    return evaluate(expr.expresion, env);
}

// Evaluates the operand and returns the complete unary expression
function unary_expr(expr: Unary, env: Environment): [Value, Environment] {
    let operand: Value = null;
    [operand, env] = evaluate(expr.operand, env);
    switch (expr.operator) {
        case "!":
            return [!is_truthy(operand), env];
            break;
        case "-":
            check_number_operand(operand, expr);
            return [-Number(operand), env];
    }
}



// Checks if the operand is a number
function check_number_operand(value: Value, unary:Unary) {
    if (Object(value) instanceof Number) return;
    throw new UntypescriptError(ErrorKind.RuntimeError, unary.operator + " Operand must be a number.", unary.operand.index); //Change to connect to error module
}

// Checks if the operands are numbers
function check_number_operands(left:Value, right: Value, binary: Binary) {
    if (Object(left) instanceof Number && Object(right) instanceof Number) return;
    throw new UntypescriptError(ErrorKind.RuntimeError, binary.operator + " Operands must be numbers.", binary.index); //Change to connect to error module
}

// Returns true for all value type Value, except for "null" and "false"
function is_truthy(value: Value): boolean {
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
function binary_expr(expr: Binary, env:Environment): [Value, Environment]  {
    let left: Value | null;
    let right: Value | null;
    [left, env]= evaluate(expr.left, env);
    [right, env] = evaluate(expr.right, env);
    let return_val: Value = null;
    if (left === null || right === null) {
        throw new UntypescriptError(ErrorKind.RuntimeError, "Expected expression to the " + left === null ? "left" : "right" + " of '" + expr.operator + "'", expr.left.index);
    }
    
    switch (expr.operator) {
        case ">":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left > right; break;
            }
        case ">=":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left >= right; break;
            }
        case "<":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left < right; break;
            }
        case "<=":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left <= right; break;
            }
        case "-":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left - right; break;
            }
        case "**":
            if (typeof left === "number" && typeof right === "number") {
                return_val = Math.pow(left, right); break;
            }
        case "/":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left / right; break;
            }
            // Fall-through runtime error for operators that require two numbers
            throw new UntypescriptError(ErrorKind.RuntimeError, "Both operands of '" + expr.operator + "' must be numbers", expr.index);
        case "*":
            if (typeof left === "number" && typeof right === "number") {
                return_val = left * right; break;
            } else if (typeof left === "string" && typeof right === "number") {
                return_val = left.repeat(right); break;
            } else if (typeof left === "number" && typeof right === "string") {
                return_val = right.repeat(left); break;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be either two numbers or a number and a string", expr.index);
        case "+":
            // Typescript can't deduce that left and right are the same type, so we need two different if conditions
            if (typeof left === "number" && typeof right === "number") {
                return_val = left + right; break;
            } else if (typeof left === "string" && typeof right === "string") {
                return_val = left + right; break;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be two numbers or two strings.", expr.index);
        case "!=":
            return_val = !isEqual(left, right); break;
        case "==":
            return_val = isEqual(left, right); break;
    }

    // Unreachable.
    return [return_val, env];
}

function block(block: Block, env: Environment): [Value, Environment] {
    let return_value: Value = null;
    env = st_push(new_frame(), env);
    for (let i = 0; i < block.body.length; i++) {
        [return_value, env] = interpret(block.body[i], env);
    }
    return [return_value, st_pop(env as NonEmptyStack<Frame>)];
}

function var_lookup(variable: Identifier, env: Environment): Value {
    const binding: Binding | undefined = lookup(variable.name, env);
    if (!(typeof binding === "undefined")) {
        if(typeof binding === "object") return `<fn ${variable.name}>`;
        return binding
    }
    throw new UntypescriptError(
        ErrorKind.UndeclaredIdentifier,
        `'${variable.name}' is not defined`,
        variable.index
    );
}

function lookup(name:string, env:Environment): Binding | undefined {
     let currentEnv = env;

    while (!is_empty(currentEnv)) {
        const frame = st_top(currentEnv);
        const value = ph_lookup(frame, name);

        if (value !== undefined) {
            return value;
        }

        currentEnv = st_pop(currentEnv);
    }

    return undefined
}

function declare(expr: Declaration, env:Environment): Environment {
    switch(expr.type) {
        case "Variable_declaration":
            let val: Value;
            if(expr.initialiser === null){
                val = null;
            } else {
                [val, env] = evaluate(expr.initialiser, env);
            }
            ph_insert(st_top(env as NonEmptyStack<Frame>), expr.name, val)
            return env
        case "Function_declaration":
            const frame = st_top(env as NonEmptyStack<Frame>);

            const existing = ph_lookup(frame, expr.name);

            const fn: FunctionBinding = {
                type: "Function_Binding",
                params: expr.params,
                body: expr.body,
            };

            if (existing === undefined) {

                ph_insert(frame, expr.name, [fn]);
            } else if (Array.isArray(existing)) {

                existing.push(fn);
            } else {
                throw new UntypescriptError(
                    ErrorKind.RuntimeError,
                    `Cannot overload non-function '${expr.name}'`,
                    expr.index
                );
            }

    return env;
    }
}

function assign_expr(assignment: Assignment, env: Environment): [Value, Environment] {
    let currentEnv = env;

    while (!is_empty(currentEnv)) {
        const frame = st_top(currentEnv);

        if (ph_lookup(frame, assignment.name) !== undefined) {
            let value: Value;
            [value] = evaluate(assignment.value, env);

            ph_insert(frame, assignment.name, value);

            return [value, env];
        }

        currentEnv = st_pop(currentEnv);
    }

    throw new UntypescriptError(
        ErrorKind.UndeclaredIdentifier,
        `'${assignment.name}' is not defined`,
        assignment.index
    );
}

function call_expr(call: Call, env: Environment): [Value, Environment] {
    let return_value: Value = null;
    const binding: Binding | undefined = lookup((call.callee as Identifier).name, env)
    if (!Array.isArray(binding)) {
        throw new UntypescriptError(
            ErrorKind.RuntimeError,
            `Expected to find function bound to identifier, instead found ${typeof binding}`,
            call.index
        );
    }
    // finds the functionBinding in the array of bindings to the 
    // callee name that match the number of args given
    const match = binding.find(fn => fn.params.length === call.args.length);

    if (!match) {
        throw new UntypescriptError(
            ErrorKind.RuntimeError,
            `No overload of '${name}' matches ${call.args.length} arguments`,
            call.index
        );
    }
    let new_env = st_push(new_frame(), env) as Environment;
    for(let i = 0; i < call.args.length; i++){
        let val:Value;
        [val, new_env] = evaluate(call.args[i], new_env)
        ph_insert(st_top(env as NonEmptyStack<Frame>), match.params[i], val)
    }
    for (let i = 0; i < match.body.body.length; i++) {
        [return_value, new_env] = interpret(match.body.body[i], new_env);
    }
    return [return_value, st_pop(new_env as NonEmptyStack<Frame>)];
}

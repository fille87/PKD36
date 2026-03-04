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
    Call,
    If,
    Logic,
    While,
    ReturnStatement,
    Break,
    ExecResult,
    NormalRes,
    ReturnRes
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
        env = interpret(res[i], env).env;
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
export function interpret(expr: Statement, env: Environment): ExecResult { 
    let res: ExecResult = {
        type:"normal",
        value: null,
        env: env
    }
    switch (expr.type) {
        case "Return":{
            if (expr.expression !== null) {
                res = evaluate(expr.expression, env);
            }

            return {
                type: "return",
                value: res.value,
                env: res.env
            };
        }
        case "Break": {

            if (expr.return_expr !== null) {
                res = evaluate(expr.return_expr, env);
            }

            return {
                type: "break",
                value: res.value,
                label: expr.loop ?? null,
                env
            };
        }
        case "Print":
            res = evaluate(expr.expression, env);
            console.log(res.value);
            return res;
        case "Expression_statement":
            return evaluate(expr.expression, env);
        case "Variable_declaration":
            res.env = declare(expr, env)
            return res;
        default:
            return res;
    }
}

// Evaluates the given expression
function evaluate(expr: Expression, env:Environment): ExecResult {
    // Variable changes the environment and returns a value
    // so evaluate must return both
    const res: ExecResult = {
        type: "normal",
        value: null,
        env: env
    }
    switch (expr.type) {
        case "Literal":
            res.value = literal_expr(expr);
            break;
        case "Grouping":
            return grouping_expr(expr, env);
        case "Unary":
            return unary_expr(expr, env);

        case "Binary":
            return binary_expr(expr, env);
        case "Block":
            return block(expr, env);
        case "While":
            return loop(expr, env);

        case "Identifier":
            res.value = var_lookup(expr, env)
            return res

        case "Assignment":
            return assign_expr(expr, env);

        case "Call":
            return call_expr(expr, env);

        case "If":
            return if_expr(expr, env);

        case "Logic":
            return logic_expr(expr, env);

            
    }
    return res; //seems neccesary but have to check
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
function unary_expr(expr: Unary, env: Environment): ExecResult {
    let res:ExecResult = evaluate(expr.operand, env);
    switch (expr.operator) {
        case "!":
            res.value = !is_truthy(res.value);
            return res;
        case "-":
            check_number_operand(res.value, expr);
            res.value = -Number(res.value);
            return res;
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
function binary_expr(expr: Binary, env:Environment): ExecResult  {
    let left_res = evaluate(expr.left, env);
    let right_res = evaluate(expr.right, env);
    let return_res:ExecResult = {type:"normal", value:null, env}
    if (left_res.value === null || right_res.value === null) {
        throw new UntypescriptError(
            ErrorKind.RuntimeError, 
            "Expected expression to the " + left_res.value === null ? "left" : "right" + " of '" + expr.operator + "'",expr.left.index);
    }
    
    switch (expr.operator) {
        case ">":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value > right_res.value; break;
            }
        case ">=":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value >= right_res.value; break;
            }
        case "<":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value < right_res.value; break;
            }
        case "<=":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value <= right_res.value; break;
            }
        case "-":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value - right_res.value; break;
            }
        case "**":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = Math.pow(left_res.value, right_res.value); break;
            }
        case "/":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value / right_res.value; break;
            }
            // Fall-through runtime error for operators that require two numbers
            throw new UntypescriptError(ErrorKind.RuntimeError, "Both operands of '" + expr.operator + "' must be numbers", expr.index);
        case "*":
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value * right_res.value; break;
            } else if (typeof left_res.value === "string" && typeof right_res.value === "number") {
                return_res.value = left_res.value.repeat(right_res.value); break;
            } else if (typeof left_res.value === "number" && typeof right_res.value === "string") {
                return_res.value = right_res.value.repeat(left_res.value); break;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be either two numbers or a number and a string", expr.index);
        case "+":
            // Typescript can't deduce that left_res.value and right_res.value are the same type, so we need two different if conditions
            if (typeof left_res.value === "number" && typeof right_res.value === "number") {
                return_res.value = left_res.value + right_res.value; break;
            } else if (typeof left_res.value === "string" && typeof right_res.value === "string") {
                return_res.value = left_res.value + right_res.value; break;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be two numbers or two strings.", expr.index);
        case "!=":
            return_res.value = !isEqual(left_res.value, right_res.value); break;
        case "==":
            return_res.value = isEqual(left_res.value, right_res.value); break;
    }

    // Unreachable.
    return return_res;
}

function block(block: Block, env: Environment): ExecResult {
    let res: ExecResult = {type:"normal", value: null, env}
    res.env = st_push(new_frame(), env);
    for (let i = 0; i < block.body.length; i++) {
        res = interpret(block.body[i], res.env);
        if(res.type === "return" || res.type === "break") break;
    }
    res.env = st_pop(res.env as NonEmptyStack<Frame>)
    return res;
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
    let res: ExecResult = {type:"normal", value: null, env}
    switch(expr.type) {
        case "Variable_declaration":
            if(expr.initialiser === null){
                res.value = null;
            } else {
                res = evaluate(expr.initialiser, env);
            }
            ph_insert(st_top(env as NonEmptyStack<Frame>), expr.name, res.value)
            return res.env
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

function assign_expr(assignment: Assignment, env: Environment): ExecResult {
    let res: ExecResult = {type:"normal", value: null, env} 
    let currentEnv = res.env;
    while (!is_empty(currentEnv)) {
        const frame = st_top(currentEnv);

        if (ph_lookup(frame, assignment.name) !== undefined) {
            let value: Value;
            res = evaluate(assignment.value, env);

            ph_insert(frame, assignment.name, res.value);

            return res;
        }

        currentEnv = st_pop(currentEnv);
    }

    throw new UntypescriptError(
        ErrorKind.UndeclaredIdentifier,
        `'${assignment.name}' is not defined`,
        assignment.index
    );
}

function call_expr(call: Call, env: Environment): ExecResult {
    let res: ExecResult = {type:"normal", value: null, env}
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
            `No overload of '${(call.callee as Identifier).name}' matches ${call.args.length} arguments`,
            call.index
        );
    }
    let new_env = st_push(new_frame(), env) as Environment;
    for(let i = 0; i < call.args.length; i++){
        let val:Value;
        let eval_res = evaluate(call.args[i], new_env)
        ph_insert(st_top(eval_res.env as NonEmptyStack<Frame>), match.params[i], eval_res.value)
    }
    new_env = get_functions(match.body.body, new_env);
    res = evaluate(match.body, new_env);
    res.env = st_pop(res.env as NonEmptyStack<Frame>)
    return res
}

function if_expr(expr: If, env: Environment): ExecResult {

    let res = evaluate(expr.condition, env);
    const condition: boolean = is_truthy(res.value);
    if(condition){
        return evaluate(expr.if_then, env);
    } else if(expr.if_else !== null){
        return evaluate(expr.if_else, env);
    }
    return {type:"normal", value: null, env}
}

function logic_expr(expr: Logic, env:Environment): ExecResult {
    let left_res: ExecResult = {type:"normal", value: null, env}
    left_res = evaluate(expr.left, env);
    left_res.value = is_truthy(left_res.value)
    switch(expr.operator) {
        case "or":
            if(is_truthy(left_res.value)){
                left_res.value = true
                return left_res
            }break;
            
        case "and":
            if(!is_truthy(left_res.value)){
                left_res.value = false
                return left_res
            }break;
    }

    let right_res:ExecResult = evaluate(expr.right, env)
    right_res.value = is_truthy(right_res.value)
    return right_res

}

function loop(expr: While, env: Environment): ExecResult {
    let loopEnv = st_push(new_frame(), env) as Environment;

    while (true) {

        const condRes = evaluate(expr.condition, loopEnv);
        loopEnv = condRes.env;

        if (!is_truthy(condRes.value)) {
            return {
                type: "normal",
                value: null,
                env: st_pop(loopEnv as NonEmptyStack<Frame>)
            };
        }

        const result = evaluate(expr.body, loopEnv);

        if (result.type === "normal") {
            loopEnv = result.env;
            continue;
        }

        if (result.type === "break") {

            if (result.label === null) {
                return {
                    type: "normal",
                    value: result.value,
                    env: st_pop(loopEnv as NonEmptyStack<Frame>)
                };
            }

            if (result.label === expr.name) {
                return {
                    type: "normal",
                    value: result.value,
                    env: st_pop(loopEnv as NonEmptyStack<Frame>)
                };
            }

            return result;
        }

        if (result.type === "return") {
            return result;
        }
    }

}
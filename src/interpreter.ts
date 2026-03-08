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
    If,
    Call,
    FunctionBinding
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
import { ch_empty, ch_insert, ch_lookup, ChainingHashtable, ph_delete, ph_empty, ph_insert, ph_keys, ph_lookup, ProbingHashtable } from "../lib/hashtables";
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
let should_return: boolean = false;

export function interpret_results(res: Array<Expression | Statement>): Value {
    let ret_val: Value = null;
    for (let i = 0; i < res.length; i += 1) {
        ret_val = interpret(res[i]);
    }
    return ret_val;
}

// Runs the interpreter
export function interpret(expr: Expression | Statement): Value { 
    switch (expr.type) {
        case "Return":
            should_return = true;
            return evaluate(expr.expression);
        case "Print":
            console.log(evaluate(expr.expression));
            return null;
        case "Expression_statement":
            evaluate(expr.expression);
            return null;
        case "Variable_declaration":
            declare(expr as Declaration);
            return null;
        case "Break":
            break_loop(expr as Break);
            return expr.return_expr != null
                ? evaluate(expr.return_expr)
                : null;
        case "Function_declaration":
            declare(expr as FunctionDec);
            return null;
        default:
            return evaluate(expr);
    }
}

// Evaluates the given expression
function evaluate(expr: Expression): Value {
    switch (expr.type) {
        case "Literal":
            return literal(expr);
        case "Grouping":
            return grouping(expr);
        case "Unary":
            return unary(expr);
        case "Binary":
            return binary(expr);
        case "Block":
            return block(expr);
        case "While":
            return loop(expr);
        case "Variable":
            return lookup(expr);
        case "If":
            return conditional(expr);
        case "Call":
            return call(expr);
        case "Assignment":
            return assign(expr);
    }
    return null; //seems neccesary but have to check
}

// Returns the value of the literal expression
function literal(expr: Literal): Value {
    return expr.value;
}

// Evaluates the expression within parentheses
function grouping(expr: Grouping) {
    return evaluate(expr.expresion);
}

// Evaluates the operand and returns the complete unary expression
function unary(expr: Unary) {
    const operand: Value = evaluate(expr.operand);
    
    switch (expr.operator) {
        case "!":
            return !is_truthy(operand);
        case "-":
            if(typeof operand != "number") {
                throw new UntypescriptError(ErrorKind.RuntimeError, "- operand must evaluate to a number", expr.operand.index);
            }
            return -operand;
    }
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
function is_truthy(value: Value): boolean {
    if (value == null) return false;
    if (typeof value === "boolean") return value;
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
    return value.toString();
}

// Evaluates the left and right sides of a binary expression and returns the result of using the operator with the values
function binary(expr: Binary) {
    const left: Value | null = evaluate(expr.left);
    const right: Value | null = evaluate(expr.right); 

    // Not actually sure if this is needed, these errors should be caught in parsing
    if (left === null || right === null) {
        throw new UntypescriptError(ErrorKind.RuntimeError, "Expected expression to the " + left === null ? "left" : "right" + " of '" + expr.operator + "'", (expr.left === null ? expr.left : expr.right).index);
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
            if (typeof left === "number" && typeof right === "number") {
                return left + right;
            } else if (typeof left === "string") {
                return left + stringify(right);
            } else if (typeof right === "string") {
                return stringify(left) + right;
            }
            throw new UntypescriptError(ErrorKind.RuntimeError, expr.operator + " operands must be two numbers or include at least one string.", expr.index);
        case "!=":
            return !isEqual(left, right);
        case "==":
            return isEqual(left, right);
    }
}

function block(block: Block): Value | null {
    let return_value: Value | null = null;
    enter_frame(null);
    for (let i = 0; i < block.body.length; i += 1) {
        return_value = interpret(block.body[i]);
        if (should_break === true || typeof should_break === "string" || should_return) {
            should_return = false;
            break;
        }
    }
    exit_frame();
    return return_value;
}

function conditional(expr: If): Value | null {
    if(is_truthy(evaluate(expr.condition))) {
        return interpret(expr.if_then);
    }
    if (expr.if_else != null) {
        return interpret(expr.if_else);
    }
    return null;
}

function lookup(expr: {name: string, index: number}): Value {
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
            //push_frame(frame);
            break;
        }
    }
    if (res === undefined) {
        throw error;
    }
    // Cant assign so best we can do is return name of function
    if(Array.isArray(res)){
        return `<fn ${expr.name}>`
    }
    switch (res.type) {
        case "Variable_Binding":
            return res.value;
        case "Uninitialized":
            throw new UntypescriptError(ErrorKind.RuntimeError, "Can't access uninitialized variable '" + expr.name + "'", expr.index);
    }
}

function declare(expr: Declaration): void {
    let frame: Frame | undefined;
    switch(expr.type) {
        
        case "Variable_declaration":
            frame = pop_frame();
            if (frame === undefined) {
                frame = empty_frame();
            }
            // Put the frame back before evaluating the initialiser
            push_frame(frame);
            let val: Uninitialized | VariableBinding = expr.initialiser === null
                ? { type: "Uninitialized" }
                : { type: "Variable_Binding", value: evaluate(expr.initialiser)};
            // Safety: We just pushed a frame onto frames
            frame = pop_frame()!;
            ph_insert(frame.vars, expr.name, val);
            push_frame(frame);
            return
        case "Function_declaration":
            frame = pop_frame();
            if (frame === undefined) {
                frame = empty_frame();
            }
            const existing = ph_lookup(frame.vars, expr.name);
            const function_dec: FunctionDec = expr;
            const fn: FunctionBinding = {
                type: "Function_Binding",
                params: function_dec.params,
                body: function_dec.body,
            };
            if (existing === undefined) {
                ph_insert(frame.vars, expr.name, [fn]);
                push_frame(frame);
                return;
            } else if(Array.isArray(existing)) {
                const match: FunctionBinding | undefined = existing.find(fn => 
                    fn.params.length === function_dec.params.length)
                // no function with the same name and same number of params
                if(match === undefined) {
                    existing.push(fn);
                    ph_insert(frame.vars, expr.name, existing)
                    push_frame(frame);
                    return
                } else {
                    throw new UntypescriptError(
                    ErrorKind.InvalidAssignment,
                    "Function '" + expr.name + "' with " + fn.params.length + " parameters already declared",
                    expr.index
                );
            
                }
            }
        throw new UntypescriptError(
            ErrorKind.RuntimeError,
            "Name is taken by variable",
            expr.index)
    }
}

function assign(expr: Assignment) {
    if (lookup(expr) === undefined) {
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
            return binding.value;
        } else {
            temp_stack = push(frame, temp_stack);
        }
    }
    return null;
}

function loop(expr: While): Value | null {
    let return_value: Value | null = null;
    enter_frame(expr.name);
    while(is_truthy(evaluate(expr.condition))) {
        return_value = interpret(expr.body);
        if (should_break != false) {
            if (is_empty(frames)) {
                should_break = false;
                return return_value;
            }
            if (should_break === true || should_break === expr.name) {
                should_break = false;
            }
            pop_frame();
            return return_value;
        }
    }
    exit_frame();
    return return_value;
}

function call(call: Call): Value {
    // must lookup outside of lookup function otherwise we have to rebuild the entire system
    // with bindings instead instead of values so that we can pass along bindings
    // this would also allow for variables to be assigned to functions
    const error = new UntypescriptError(
        ErrorKind.RuntimeError, 
        "Couldn't find variable '" + call.callee.name + "' in the current scope",
        call.index);
    if (is_empty(frames)) {
        throw error;
    }
    const callee: string = call.callee.name;
    let temp_stack = empty_stack<Frame>();
    let res: Binding | undefined;
    let frame: Frame;
    while(!is_empty(frames)) {
        // Safety: We've made sure frames is not empty
        frame = pop_frame()!;
        temp_stack = push(frame, temp_stack);
        res = ph_lookup(frame.vars, callee);
        if (res != undefined) {
            while(!is_empty(temp_stack)) {
                const temp = top(temp_stack);
                temp_stack = pop(temp_stack);
                push_frame(temp);
            }
            //push_frame(frame);
            break;
        }
    }
    if(res === undefined) throw error;
    const binding: Binding = res
    if (!Array.isArray(binding)) {
        throw new UntypescriptError(
            ErrorKind.RuntimeError,
            `Expected to find function bound to identifier, instead found ${typeof binding}`,
            call.index
        );
    }
    // finds the functionBinding in the array of bindings to the 
    // callee name that match the number of args given
    const match: FunctionBinding | undefined = binding.find(fn => fn.params.length === call.args.length);
    
    if (!match) {
        throw new UntypescriptError(
            ErrorKind.RuntimeError,
            `No overload of '${callee}' matches ${call.args.length} arguments`,
            call.index
        );
    }
    enter_frame(null);
    for(let i = 0; i < call.args.length; i++){
        let args_binding: VariableBinding = {
            type: "Variable_Binding",
            value: evaluate(call.args[i])
        };
        const current_frame: Frame = pop_frame() as Frame;
        ph_insert(current_frame.vars, match.params[i], args_binding)
        push_frame(current_frame);
    }

    let return_value: Value = null;
    for (let i = 0; i < match.body.body.length; i += 1) {
        return_value = interpret(match.body.body[i]);
        if (should_return != false) {
            should_return = false;
            break;
        }
    }
    exit_frame();
    return return_value
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
    should_break = expr.label == null ? true : expr.label;
}

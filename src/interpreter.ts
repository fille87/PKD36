import {
    Expression, Literal, Unary, Binary, Value,
    Statement,
    Block,
    Assignment,
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
    FunctionBinding,
    Logic,
    Variable
} from"../lib/types";
import {
    UntypedscriptError,
    ErrorKind,
    error_with_length,
} from "./error";
import { ph_empty, ph_insert, ph_lookup } from "../lib/hashtables";
import { Stack, empty as empty_stack, push, top, pop, is_empty } from "../lib/stack";

// Default values for each new Frame's hashtable
const DEFAULT_VARIABLE_SLOTS = 50;
const HASH_FUNCTION = (str: string) => str.charCodeAt(0);

const GLOBALS: Frame = empty_frame();
let frames: Stack<Frame> = push(GLOBALS, empty_stack());

let should_break: string | boolean = false;
let should_return: boolean = false;

/**
 * Interprets the result from the parser
 * @param res The results Array to interpret
 * @returns The return value of the last interpreted Expression or Statement
 */
export function interpret_results(res: Array<Expression | Statement>): Value {
    let ret_val: Value = null;
    for (let i = 0; i < res.length; i += 1) {
        ret_val = interpret(res[i]);
    }
    return ret_val;
}

/**
 * Interpret a single Statement or Expression
 * @param expr The Expression or Statement to interpret
 * @returns The return value of the Expression or Statement
 */
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

/**
 * Evaluates an Expression
 * @param expr The Expression to evaluate
 * @returns The return value of the Expression
 */
function evaluate(expr: Expression): Value {
    switch (expr.type) {
        case "Literal":
            return literal(expr);
        case "Unary":
            return unary(expr);
        case "Binary":
            return binary(expr);
        case "Logic":
            return logic(expr);
        case "Block":
            return block(expr);
        case "While":
            return loop(expr);
        case "Variable":
            return get_variable_value(expr);
        case "If":
            return conditional(expr);
        case "Call":
            return call(expr);
        case "Assignment":
            return assign(expr);
    }
}

/**
 * Returns the value of a Literal
 * @param lit The Literal to get the value of
 * @returns The Literal value
 */
function literal(lit: Literal): Value {
    return lit.value;
}

/**
 * Evaluates a unary expression
 * @param expr The expression to evaluate
 * @returns The result of the evaluation
 * @throws Throws an error if '-' is used with something that doesn't evaluate to a number
 */
function unary(expr: Unary): number | boolean {
    const operand: Value = evaluate(expr.operand);
    
    switch (expr.operator) {
        case "!":
            return !is_truthy(operand);
        case "-":
            if(typeof operand != "number") {
                throw new UntypedscriptError(ErrorKind.RuntimeError, "- operand must evaluate to a number", expr.operand.index);
            }
            return -operand;
    }
}

/**
 * Checks if a Value is considered 'truthy' (equivalent to true) or not
 * All values except for null and false are considered truthy
 * @param value The value to check
 * @returns Whether the value is truthy or not
 */
function is_truthy(value: Value): boolean {
    if (value == null) return false;
    if (typeof value === "boolean") return value;
    return true;
}

/**
 * Checks if two values are equal
 * @param a The first value
 * @param b The second value
 * @returns True if a and b are equal, false otherwise
 */
function is_equal(a: Value, b: Value): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return typeof a === typeof b
              ? a === b
                  ? true
                  : false
              : false;
}

/**
 * Gets the string representation of a Value
 * @param value The value to stringify
 * @returns The string representation of a value
 */
function stringify(value: Value): string {
    if (value == null) return "null";
    return value.toString();
}


/**
 * Evaluates the left and right sides of a binary expression, 
 * then applies the specified operator to these
 * @param expr The binary expression to evaluate
 * @returns The result of the evaluation
 * @throws Throws an error if invalid types are passed to the operator (like when trying to add null and null)
 */
function binary(expr: Binary): Value {
    const left = evaluate(expr.left);
    const right = evaluate(expr.right); 

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
            throw new UntypedscriptError(ErrorKind.RuntimeError, "Both operands of '" + expr.operator + "' must be numbers", expr.index);
        case "*":
            if (typeof left === "number" && typeof right === "number") {
                return left * right;
            } else if (typeof left === "string" && typeof right === "number") {
                return left.repeat(right);
            } else if (typeof left === "number" && typeof right === "string") {
                return right.repeat(left);
            }
            throw new UntypedscriptError(
                ErrorKind.RuntimeError, 
                expr.operator + " operands must be either two numbers or a number and a string", 
                expr.index
            );
        case "+":
            if (typeof left === "number" && typeof right === "number") {
                return left + right;
            } else if (typeof left === "string") {
                return left + stringify(right);
            } else if (typeof right === "string") {
                return stringify(left) + right;
            }
            throw new UntypedscriptError(
                ErrorKind.RuntimeError, 
                expr.operator + " operands must be two numbers or include at least one string.", 
                expr.index
            );
        case "!=":
            return !is_equal(left, right);
        case "==":
            return is_equal(left, right);
    }
}

/**
 * Evaluates a logic expression
 * @param expr The expression to evaluate
 * @returns The result of the evaluation
 */
function logic(expr: Logic): boolean {
    const left = evaluate(expr.left);
    const right = evaluate(expr.right); 

    switch (expr.operator) {
        case "or":
            return is_truthy(left) || is_truthy(right);
        case "and":
            return is_truthy(left) && is_truthy(right);
    }
}

/**
 * Evaluates a block expression
 * @param expr The expression to evaluate
 * @returns The result of the evaluation. Corresponds to the result 
 * of the last Expression or Statement in the block, or a break/break return
 */
function block(block: Block): Value {
    let return_value: Value = null;
    enter_frame(null);
    for (let i = 0; i < block.body.length; i += 1) {
        return_value = interpret(block.body[i]);

        if (should_break !== false) {
            break;
        }
    }
    pop_frame();
    return return_value;
}

/**
 * Evaluates a conditional expression
 * @param expr The expression to evaluate
 * @returns The result of the evaluation. 
 */
function conditional(expr: If): Value {
    if(is_truthy(evaluate(expr.condition))) {
        return interpret(expr.if_then);
    }
    if (expr.if_else != null) {
        return interpret(expr.if_else);
    }
    return null;
}

/**
 * Looks up the type of Binding of a previously declared (in this or a higher scope) identifier
 * @param name The identifier to look up
 * @returns Undefined the identifier hasn't already been declared, otherwise returns its type of Binding
 */
function lookup(name: string): Binding | undefined {
    if (is_empty(frames)) {
        return undefined;
    }
    let temp_stack = empty_stack<Frame>();
    let res: Binding | undefined;
    let frame: Frame;
    while(!is_empty(frames)) {
        // Safety: We've made sure frames is not empty
        frame = pop_frame()!;
        temp_stack = push(frame, temp_stack);
        res = ph_lookup(frame.vars, name);
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
    return res;
}

/**
 * Gets the value of a Variable in the current scope
 * @param expr The Variable to look up
 * @returns The Value of the Variable. Function bindings return a string representation.
 * @throws Throws an error if the variable couldn't be found in the current scope, or if it is uninitialized.
 */
function get_variable_value(expr: Variable): Value {
    const res = lookup(expr.name);
    if (res === undefined) {
        throw error_with_length(ErrorKind.RuntimeError, "Couldn't find variable '" + expr.name + "' in the current scope", expr.index, expr.name.length);
    }

    if(Array.isArray(res)){
        return `<fn ${expr.name}>`
    }
    switch (res.type) {
        case "Variable_Binding":
            return res.value;
        case "Uninitialized":
            throw new UntypedscriptError(ErrorKind.RuntimeError, "Can't access uninitialized variable '" + expr.name + "'", expr.index);
    }

}

/**
 * Declares a variable in the current scope
 * @param expr The Declaration statement
 * @throws Throws an error if trying to overwrite a function in the current scope, 
 * redeclaring a function with the same number of parameters or redeclaring a variable that already exists with no initializer
 */
function declare(expr: Declaration): void {
    let frame: Frame | undefined;
    let existing: Binding | undefined;
    switch(expr.type) {
        case "Variable_declaration":
            frame = pop_frame();
            if (frame === undefined) {
                frame = empty_frame();
            }
            existing = ph_lookup(frame.vars, expr.name);
            if (existing && Array.isArray(existing)) {
                // We don't want to allow overwriting a function identifier 
                // in the same scope with an arbitrary value
                throw error_with_length(
                    ErrorKind.RuntimeError, 
                    "Cannot overwrite function identifier '" + expr.name + "' in the same scope", 
                    expr.identifier_index, 
                    expr.name.length
                );
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
            return;

        case "Function_declaration":
            frame = pop_frame();
            if (frame === undefined) {
                frame = empty_frame();
            }
            existing = ph_lookup(frame.vars, expr.name);
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
                    return;
                } else {
                    throw new UntypedscriptError(
                        ErrorKind.InvalidAssignment,
                        "Function '" + expr.name + "' with " + fn.params.length + " parameters already declared",
                        expr.index
                    );
                }
            }
        throw new UntypedscriptError(
            ErrorKind.RuntimeError,
            "Name is taken by variable",
            expr.index)
    }
}

/**
 * Evaluates and assigns a value to an identifier in the current scope
 * @param expr The Assignment expression
 * @param returns The value that was assigned
 * @throws Throws an error if trying to assign a value to a function identifier
 */
function assign(expr: Assignment): Value {
    const res = lookup(expr.name); // This will throw an error if not already declared
    if (Array.isArray(res)) {
        throw error_with_length(ErrorKind.RuntimeError, "Cannot assign value to function identifier '" + expr.name + "'", expr.index, expr.name.length);
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

/**
 * Evaluates a While expression
 * @param expr The expression to evaluate
 * @returns The result of the evaluation. Corresponds to the result 
 * of the last Expression or Statement in the loop, or a break/break return
 */
function loop(expr: While): Value {
    let return_value: Value = null;
    enter_frame(expr.name);
    while(is_truthy(evaluate(expr.condition))) {
        return_value = interpret(expr.body);
        if (should_break !== false) {
            if (should_break === true || should_break === expr.name) {
                should_break = false;
                break;
            }
            pop_frame();        // clean up this loop's frame
            return return_value; // propagate break outward
        }
    }
    pop_frame();
    return return_value;
}

/**
 * Evaluates a function call
 * @param call The Call expression to evaluate
 * @returns The result of the call.
 * @throws Throws an error if the identifier can't be found in the current scope,
 * if trying to call something that isn't a function binding or if there is no function
 * with the right number of arguments declared
 */
function call(call: Call): Value {
    // must lookup outside of lookup function otherwise we have to rebuild the entire system
    // with bindings instead instead of values so that we can pass along bindings
    // this would also allow for variables to be assigned to functions
    const error = new UntypedscriptError(
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
            break;
        }
    }
    if(res === undefined) throw error;
    const binding: Binding = res
    if (!Array.isArray(binding)) {
        throw new UntypedscriptError(
            ErrorKind.RuntimeError,
            `Expected to find function bound to identifier, instead found ${typeof binding}`,
            call.index
        );
    }
    // finds the functionBinding in the array of bindings to the 
    // callee name that match the number of args given
    const match: FunctionBinding | undefined = binding.find(fn => fn.params.length === call.args.length);
    
    if (!match) {
        throw new UntypedscriptError(
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
    pop_frame();
    return return_value
}

/**
 * Pops the top Frame off the frame stack
 * @returns The top Frame, or undefined if the stack is empty
 */
function pop_frame(): Frame | undefined {
    if (is_empty(frames)) {
        return undefined;
    } 
    const frame = top(frames);
    frames = pop(frames);
    return frame;
}

/**
 * Pushes a Frame onto the frame stack
 * @param frame The Frame to push
 */
function push_frame(frame: Frame) {
    frames = push(frame, frames);
}

/**
 * Pushes an empty Frame with an optional label onto the frame stack
 * @param label The label of the Frame, or null for none
 */
function enter_frame(label: string | null) {
    const frame: Frame = empty_frame();
    frame.label = label;
    push_frame(frame);
}

/**
 * Creates an empty Frame with default settings
 * @returns An empty Frame
 */
function empty_frame(): Frame {
    return {
        label: null,
        vars: ph_empty(DEFAULT_VARIABLE_SLOTS, HASH_FUNCTION),
    };
}

/**
 * Finds a Frame in the frame stack by label
 * @param label The label to look for
 * @returns The matching Frame if found, undefined otherwise
 */
function frame_by_label(label: string): Frame | undefined {
    let temp_stack = frames;
    while(!is_empty(temp_stack)) {
        const frame = top(temp_stack);
        if (frame.label === label) {
            return frame;
        }
        temp_stack = pop(temp_stack);
    }
}

/**
 * Interprets a Break statement and sets the corresponding break flag
 * @param statement The Break statement
 * @throws Throws an error if trying to break from outside a block/loop, or if the label doesn't exist
 */
function break_loop(statement: Break) {
    if (is_empty(frames) || is_empty(pop(frames))) {
        // If there aren't at least 2 frames on the stack we can't be inside a block, so we don't allow breakin
        throw error_with_length(ErrorKind.RuntimeError, "Can only break from inside a block or loop", statement.index, 1);
    }
    if (statement.label != null && frame_by_label(statement.label) === undefined) {
        throw error_with_length(ErrorKind.RuntimeError, "Break label '" + statement.label + "' doesn't exist", statement.index, statement.label.length);
    }
    should_break = statement.label == null ? true : statement.label;
}

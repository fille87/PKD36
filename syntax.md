## Data types
Untypedscript supports strings, numbers (floats), booleans and null.

## Operators
Strings are concatenated with +.  
Repeated string concatenation with string * number
** operator is exponentiation
Logical operators are 'and' and 'or'

## Comments
Comments start with a :: and span the rest of the line

## Functions
Function declarations follow the syntax:
```
fn name(arg1, arg2) { }
```
Functions can be overloaded. These are both different functions:
```
fn name(arg1) { }
fn name(arg1, arg2) { }
```

## Assignments
Assignments are made with the var keyword.

## Loops and blocks
A block (including loops, if/else and function declarations) implicitly returns the last statement, allowing syntax like:
```
var x = {
    var y = 1 + 2;
    y
}; :: x = 3
```
```
var y = if true { 1 } else { 3 }; :: y = 1
```
An infinite loop can be declared with the loop keyword  
While conditions don't require parentheses  
Loops and breaks/continues can be labeled with the syntax:
```
loop: name {
    loop {
        break: name;
    }
}
```
```
while x == 2: name {
    break: name;
}
```
Can also explicitly break with a return value:
```
var y = loop: name {
    break: name return 5;
}; :: y = 5
```

## Keywords
'print <Expression>;' prints an expression to the console
if/else don't require parentheses and are considered expressions
```
if true {

} else if false {

}
```

## Statements and expressions
Every statement ends with a semicolon. A program or block consists of any number of statements, optionally followed by an expression.
The value of the last expression or statement in a function, loop, block or program is implicitly returned. 
A statement returns the value null.

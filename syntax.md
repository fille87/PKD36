## Comments
Comments start with a :: and span the rest of the line

## Operations
Strings are concatenated with +.  
Repeated concatenation with *  
** operator is exponentiation  

## Keywords
and, or  
if/else don't require parentheses  
```
if true {

} else if false {

}
```

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
A block implicitly returns the last statement, allowing syntax like:
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

## Statements and expressions
Every statement ends with a semicolon  
The value of the last expression or statement in a function, loop, block or program is implicitly returned. 
A statement has the value null.

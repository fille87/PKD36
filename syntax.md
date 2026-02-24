## Comments
Comments start with a :: and span the rest of the line

## Operations
Strings are concatenated with +. 
Repeated concatenation with *
** operator is exponentiation

## Keywords
and, or
if/else don't require parentheses
Ternary expressions are supported?

## Functions
Function declarations follow the syntax: fn name(arg1, arg2) { }

## Assignments
Assignments are made with the var keyword.

## Loops and blocks
A block implicitly returns the last statement, allowing syntax like:
  
```
var x = {
    var y = 1 + 2;
    y
} :: x = 3```
  
```
var y = if true { 1 } else { 3 } :: y = 1
```
  
An infinite loop can be declared with the loop keyword
While conditions don't require parentheses
Loops and breaks/continues can be labeled with the syntax:
  
```
loop; name {
    break name;
}
```
  
```
while x == 2; name {
    break name;
}
```

## Statements and expressions
Every statement ends with a semicolon
Last expression is implicitly returned, if there is none then null is returned

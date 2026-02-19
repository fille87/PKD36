export type Value = {

};
type Operator = "+" | "-" | "*" | "/";
type Literal = number | string | boolean;
type OperatorCombination = Unary | Binary;
type Unary = {
    operator: Operator;
    value: Literal;
};
type Binary = {
    operator: Operator;
    left: Literal;
    right: Literal;
};

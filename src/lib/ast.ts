// common/ast.ts
export type Program = {
  type: "Program";
  body: Statement[];
};

export type Statement =
  | FunctionDeclaration
  | ReturnStatement
  | ExpressionStatement
  | VariableDeclaration
  | CommentStatement
  | IfStatement
  | WhileStatement
  | ForStatement;

export type FunctionDeclaration = {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: Statement[];
};

export type ReturnStatement = {
  type: "ReturnStatement";
  argument: Expression;
};

export type ExpressionStatement = {
  type: "ExpressionStatement";
  expression: Expression;
};

export type Expression =
  | BinaryExpression
  | Identifier
  | Literal
  | CallExpression;

export type BinaryExpression = {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
};

export type Identifier = {
  type: "Identifier";
  name: string;
};

export type Literal = {
  type: "Literal";
  value: string | number;
};

export type VariableDeclaration = {
  type: "VariableDeclaration";
  kind: string; // let, const, var
  name: string;
  value: Expression;
};

export type CallExpression = {
  type: "CallExpression";
  callee: Identifier;
  arguments: Expression[];
};

export type CommentStatement = {
  type: "CommentStatement";
  value: string;
};

export type IfStatement = {
  type: "IfStatement";
  test: Expression;
  consequent: Statement[];
  alternate?: Statement | IfStatement;
};

export type WhileStatement = {
  type: "WhileStatement";
  test: Expression;
  body: Statement[];
};

export type ForStatement = {
  type: "ForStatement";
  init: Statement | null;
  test: Expression | null;
  update: Statement | null;
  body: Statement[];
};

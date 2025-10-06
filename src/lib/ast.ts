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
  | ForStatement
  | DoWhileStatement
  | TryStatement
  | BlockStatement
  | MainMethod
  | undefined;

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
  | CallExpression
  | UnaryExpression
  | LambdaExpression
  | ArrayExpression
  | MemberExpression;

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
  value: string | number | boolean | null;
};

export type VariableDeclaration = {
  type: "VariableDeclaration";
  kind: string; // let, const, var
  name: string;
  value: Expression;
};

export type CallExpression = {
  type: "CallExpression";
  callee: Identifier | MemberExpression;
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
  // Js
  init?: Statement | null;
  test?: Expression | null;
  update?: Statement | null;
  // Python
  varName?: string;
  rangeExpr?: Expression;
  body: Statement[];
};

export type DoWhileStatement = {
  type: "DoWhileStatement";
  body: Statement[];
  test: Expression;
};

export type UnaryExpression = {
  type: "UnaryExpression";
  operator: string;
  argument: Expression;
};

export type LambdaExpression = {
  type: "LambdaExpression";
  params: string[];
  body: Expression;
};

export type TryStatement = {
  type: "TryStatement";
  block: Statement[];
  handler?: {
    param: Identifier;
    body: Statement[];
  };
  finalizer?: Statement[];
};

export type BlockStatement = {
  type: "BlockStatement";
  body: Statement[];
};

export type ArrayExpression = {
  type: "ArrayExpression";
  elements: Expression[];
};

export type MemberExpression = {
  type: "MemberExpression";
  object: Expression;
  property: Expression;
};

export interface MainMethod {
  type: "MainMethod";
  body: Statement[];
}

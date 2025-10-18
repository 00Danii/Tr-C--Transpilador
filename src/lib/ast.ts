export type Program = {
  type: "Program";
  body: Statement[];
};

export type Statement =
  | FunctionDeclaration
  | ReturnStatement
  | ExpressionStatement
  | VariableDeclaration
  | ArrayDeclaration
  | CommentStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | DoWhileStatement
  | SwitchStatement
  | TryStatement
  | BlockStatement
  | MainMethod
  | ClassDeclaration
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
  | LogicalExpression
  | Identifier
  | Literal
  | CallExpression
  | UnaryExpression
  | LambdaExpression
  | ArrayExpression
  | MemberExpression
  | CommentStatement
  | ArrayKeyValue;

export type BinaryExpression = {
  type: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
};

export type Identifier = {
  type: "Identifier";
  name: string;
  javaType?: string;
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
  until?: boolean;
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
  elements: (Expression | ArrayKeyValue)[];
};

export type ArrayKeyValue = {
  type: "ArrayKeyValue";
  key: Expression;
  value: Expression;
};

export type MemberExpression = {
  type: "MemberExpression";
  object: Expression;
  property: Expression;
  computed?: boolean;
};

export type SwitchStatement = {
  type: "SwitchStatement";
  discriminant: Expression;
  cases: SwitchCase[];
  defaultCase?: Statement[];
};

export type SwitchCase = {
  test: Expression | null; // null para default
  consequent: Statement[];
};

// Para operadores lógicos
export type LogicalExpression = {
  type: "LogicalExpression";
  operator: string; // "&&", "||", "!"
  left: Expression;
  right?: Expression; // right es opcional para "!"
};

// Para arreglos multidimensionales
export type ArrayDeclaration = {
  type: "ArrayDeclaration";
  name: string;
  dimensions: Expression[];
  initialValue?: ArrayExpression;
};

export interface MainMethod {
  type: "MainMethod";
  body: Statement[];
}

export type ClassDeclaration = {
  type: "ClassDeclaration";
  name: string;
  superClass?: Identifier;
  body: (MethodDefinition | PropertyDefinition)[];
};

export type MethodDefinition = {
  type: "MethodDefinition";
  key: Identifier;
  value: FunctionExpression;
  kind: "constructor" | "method" | "get" | "set";
  static: boolean;
  visibility?: "public" | "private" | "protected";
};

export type PropertyDefinition = {
  type: "PropertyDefinition";
  key: Identifier;
  value?: Expression;
  static: boolean;
  visibility?: "public" | "private" | "protected";
};

export type FunctionExpression = {
  type: "FunctionExpression";
  params: string[];
  body: Statement[];
};

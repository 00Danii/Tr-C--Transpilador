import { Token } from "./lexer";
import {
  Program,
  Statement,
  FunctionDeclaration,
  ReturnStatement,
  Expression,
  ExpressionStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  Identifier,
} from "../ast";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(n = 0) {
    return tokens[current + n];
  }

  function consume(type?: string): Token {
    const token = tokens[current];
    if (!token) throw new Error("Fin inesperada de la entrada");
    if (type && token.type !== type) {
      throw new Error(`Se esperaba ${type}, pero se obtuvo ${token.type}`);
    }
    current++;
    return token;
  }

  function parseProgram(): Program {
    const body: Statement[] = [];
    while (current < tokens.length) {
      body.push(parseStatement());
    }
    return { type: "Program", body };
  }

  function parseStatement(): Statement {
    const token = peek();
    if (token.type === "LINE_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }
    if (token.type === "DEF") return parseFunctionDeclaration();
    if (token.type === "RETURN") return parseReturnStatement();
    if (token.type === "IF") return parseIfStatement();
    if (token.type === "WHILE") return parseWhileStatement();
    if (token.type === "FOR") return parseForStatement();
    // Asignación: x = 10
    if (
      token.type === "IDENTIFIER" &&
      peek(1)?.type === "OPERATOR" &&
      peek(1)?.value === "="
    ) {
      const left: Identifier = {
        type: "Identifier",
        name: String(consume("IDENTIFIER").value),
      };
      consume("OPERATOR"); // =
      const right = parseExpression();
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left,
          right,
        },
      };
    }
    // Expresión: print(x)
    if (token.type === "PRINT") {
      return parsePrintStatement();
    }

    // Si es expresión simple
    return parseExpressionStatement();
  }

  function parseFunctionDeclaration(): FunctionDeclaration {
    consume("DEF");
    const name = String(consume("IDENTIFIER").value);
    consume("PUNCTUATION"); // (
    const params: string[] = [];
    while (peek().type !== "PUNCTUATION" || peek().value !== ")") {
      params.push(String(consume("IDENTIFIER").value));
      if (peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
      }
    }
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // :
    // Cuerpo: parsea hasta dos saltos de línea seguidos o EOF
    const body: Statement[] = [];
    let newlineCount = 0;
    while (current < tokens.length) {
      if (peek().type === "NEWLINE") {
        consume("NEWLINE");
        newlineCount++;
        if (newlineCount >= 2) break;
        continue;
      }
      newlineCount = 0;
      body.push(parseStatement());
    }
    return { type: "FunctionDeclaration", name, params, body };
  }

  function parseReturnStatement(): ReturnStatement {
    consume("RETURN");
    const argument = parseExpression();
    return { type: "ReturnStatement", argument };
  }

  function parseIfStatement(): IfStatement {
    consume("IF");
    const test = parseExpression();
    consume("PUNCTUATION"); // :
    const consequent: Statement[] = [];
    while (
      peek() &&
      peek().type !== "ELIF" &&
      peek().type !== "ELSE" &&
      peek().type !== "NEWLINE"
    ) {
      consequent.push(parseStatement());
    }
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELIF") {
      consume("ELIF");
      alternate = parseIfStatement();
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      consume("PUNCTUATION"); // :
      const elseBody: Statement[] = [];
      while (peek() && peek().type !== "NEWLINE") {
        elseBody.push(parseStatement());
      }
      alternate = {
        type: "IfStatement",
        test: { type: "Literal", value: true },
        consequent: elseBody,
      };
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseWhileStatement(): WhileStatement {
    consume("WHILE");
    const test = parseExpression();
    consume("PUNCTUATION"); // :
    const body: Statement[] = [];
    let newlineCount = 0;
    while (current < tokens.length) {
      if (peek().type === "NEWLINE") {
        consume("NEWLINE");
        newlineCount++;
        if (newlineCount >= 2) break;
        continue;
      }
      newlineCount = 0;
      body.push(parseStatement());
    }
    return { type: "WhileStatement", test, body };
  }

  function parseForStatement(): ForStatement {
    consume("FOR");
    const varName = String(consume("IDENTIFIER").value);
    consume("IN");
    const rangeExpr = parseExpression();
    consume("PUNCTUATION"); // :
    const body: Statement[] = [];
    while (peek() && peek().type !== "NEWLINE") {
      body.push(parseStatement());
    }
    return {
      type: "ForStatement",
      init: null,
      test: null,
      update: null,
      body,
    };
  }

  function parsePrintStatement(): ExpressionStatement {
    consume("PRINT");
    consume("PUNCTUATION"); // (
    const args: Expression[] = [];
    // Solo parsea una expresión hasta el cierre de paréntesis
    if (peek() && peek().type !== "PUNCTUATION" && peek().value !== ")") {
      args.push(parseExpression());
    }
    while (peek().type === "PUNCTUATION" && peek().value === ",") {
      consume("PUNCTUATION");
      args.push(parseExpression());
    }
    consume("PUNCTUATION"); // )
    return {
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "print" },
        arguments: args,
      },
    };
  }

  function parseExpressionStatement(): ExpressionStatement {
    const expr = parseExpression();
    return { type: "ExpressionStatement", expression: expr };
  }

  function parseExpression(): Expression {
    let left = parsePrimary();
    while (peek() && peek().type === "OPERATOR") {
      const operator = String(consume("OPERATOR").value);
      const right = parsePrimary();
      left = { type: "BinaryExpression", operator, left, right };
    }
    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();
    if (token.type === "NUMBER" || token.type === "STRING") {
      consume();
      return { type: "Literal", value: token.value };
    }
    if (token.type === "TRUE") {
      consume();
      return { type: "Literal", value: true };
    }
    if (token.type === "FALSE") {
      consume();
      return { type: "Literal", value: false };
    }
    if (token.type === "IDENTIFIER") {
      consume();
      return { type: "Identifier", name: String(token.value) } as Identifier;
    }
    if (token.type === "OPERATOR" && token.value === "not") {
      consume();
      const argument = parsePrimary();
      return {
        type: "UnaryExpression",
        operator: "not",
        argument,
      };
    }
    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  return parseProgram();
}

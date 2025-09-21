// js/parser.ts
import { Token } from "./lexer";
import {
  Program,
  Statement,
  FunctionDeclaration,
  ReturnStatement,
  Expression,
  ExpressionStatement,
} from "../ast";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek() {
    return tokens[current];
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
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }
    if (token.type === "CONSOLE_LOG") {
      return parseConsoleLog();
    }
    if (token.type === "FUNCTION") return parseFunctionDeclaration();
    if (token.type === "RETURN") return parseReturnStatement();
    if (
      token.type === "IDENTIFIER" &&
      ["let", "const", "var"].includes(token.value as string)
    ) {
      return parseVariableDeclaration();
    }
    return parseExpressionStatement();
  }

  function parseConsoleLog(): ExpressionStatement {
    consume("CONSOLE_LOG");
    consume("PUNCTUATION"); // (
    const args: Expression[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === ")")) {
      args.push(parseExpression());
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
      }
    }
    consume("PUNCTUATION"); // )
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
      consume("PUNCTUATION");
    }
    return {
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "print" },
        arguments: args,
      },
    };
  }

  function parseFunctionDeclaration(): FunctionDeclaration {
    consume("FUNCTION");
    const name = String(consume("IDENTIFIER").value);

    consume("PUNCTUATION"); // (
    const params: string[] = [];
    while (peek().value !== ")") {
      params.push(String(consume("IDENTIFIER").value));
      if (peek().value === ",") consume("PUNCTUATION");
    }
    consume("PUNCTUATION"); // )

    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek().value !== "}") {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }

    return { type: "FunctionDeclaration", name, params, body };
  }

  function parseReturnStatement(): ReturnStatement {
    consume("RETURN");
    const argument = parseExpression();
    consume("PUNCTUATION"); // ;
    return { type: "ReturnStatement", argument };
  }

  function parseExpressionStatement(): ExpressionStatement {
    const expr = parseExpression();
    // Si el siguiente token es ';', consúmelo, pero no es obligatorio
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
      consume("PUNCTUATION");
    }
    return { type: "ExpressionStatement", expression: expr };
  }

  function parseVariableDeclaration(): Statement {
    const kind = consume("IDENTIFIER").value; // let, const, var
    const name = String(consume("IDENTIFIER").value);
    consume("OPERATOR"); // =
    const value = parseExpression();
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
      consume("PUNCTUATION");
    }
    return {
      type: "VariableDeclaration",
      kind: String(kind),
      name,
      value,
    };
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

    if (token.type === "IDENTIFIER") {
      consume();
      // Si el siguiente token es '(', es una llamada a función
      if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
        consume("PUNCTUATION"); // consume '('
        const args: Expression[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          args.push(parseExpression());
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION"); // consume ','
          }
        }
        consume("PUNCTUATION"); // consume ')'
        return {
          type: "CallExpression",
          callee: { type: "Identifier", name: String(token.value) },
          arguments: args,
        };
      }
      return { type: "Identifier", name: String(token.value) };
    }

    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  return parseProgram();
}

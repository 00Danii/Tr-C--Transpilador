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
  DoWhileStatement,
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
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    if (token.type === "CONSOLE_LOG") {
      return parseConsoleLog();
    }

    if (token.type === "FUNCTION") return parseFunctionDeclaration();

    if (token.type === "RETURN") return parseReturnStatement();

    if (token.type === "IF") return parseIfStatement();

    if (token.type === "DO") return parseDoWhileStatement();

    if (token.type === "WHILE") return parseWhileStatement();

    if (token.type === "FOR") return parseForStatement();

    // x++;
    if (token.type === "IDENTIFIER" && peek(1)?.type === "INCREMENT") {
      const name = String(consume("IDENTIFIER").value);
      consume("INCREMENT");
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }

    // x--;
    if (token.type === "IDENTIFIER" && peek(1)?.type === "DECREMENT") {
      const name = String(consume("IDENTIFIER").value);
      consume("DECREMENT");
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "-",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }

    if (
      token.type === "IDENTIFIER" &&
      ["let", "const", "var"].includes(token.value as string)
    ) {
      return parseVariableDeclaration();
    }
    return parseExpressionStatement();
  }

  function parseDoWhileStatement(): DoWhileStatement {
    consume("DO");
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    consume("WHILE");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
      consume("PUNCTUATION");
    }
    return { type: "DoWhileStatement", body, test };
  }

  function parseForInitOrUpdate(): Statement | null {
    const token = peek();
    if (
      !token ||
      (token.type === "PUNCTUATION" &&
        (token.value === ";" || token.value === ")"))
    ) {
      return null;
    }
    // x++
    if (token.type === "IDENTIFIER" && peek(1)?.type === "INCREMENT") {
      const name = String(consume("IDENTIFIER").value);
      consume("INCREMENT");
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }
    // x--
    if (token.type === "IDENTIFIER" && peek(1)?.type === "DECREMENT") {
      const name = String(consume("IDENTIFIER").value);
      consume("DECREMENT");
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "-",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }
    // VariableDeclaration
    if (
      token.type === "IDENTIFIER" &&
      ["let", "const", "var"].includes(token.value as string)
    ) {
      const kind = consume("IDENTIFIER").value;
      const name = String(consume("IDENTIFIER").value);
      consume("OPERATOR"); // =
      const value = parseExpression();
      return {
        type: "VariableDeclaration",
        kind: String(kind),
        name,
        value,
      };
    }
    // ExpressionStatement
    const expr = parseExpression();
    return { type: "ExpressionStatement", expression: expr };
  }

  function parseForStatement(): ForStatement {
    consume("FOR");
    consume("PUNCTUATION"); // (
    let init: Statement | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ";")) {
      init = parseForInitOrUpdate();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION"); // <-- consume el punto y coma después de init
      }
    } else {
      consume("PUNCTUATION"); // <-- consume el punto y coma si init está vacío
    }
    let test: Expression | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ";")) {
      test = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION"); // <-- consume el punto y coma después de test
      }
    } else {
      consume("PUNCTUATION"); // <-- consume el punto y coma si test está vacío
    }
    let update: Statement | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ")")) {
      update = parseForInitOrUpdate();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ")") {
        consume("PUNCTUATION"); // <-- consume el paréntesis después de update
      }
    } else {
      consume("PUNCTUATION"); // <-- consume el paréntesis si update está vacío
    }
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return { type: "ForStatement", init, test, update, body };
  }

  function parseWhileStatement(): WhileStatement {
    consume("WHILE");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return { type: "WhileStatement", test, body };
  }

  function parseIfStatement(): IfStatement {
    consume("IF");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // {
    const consequent: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      consequent.push(parseStatement());
    }
    consume("PUNCTUATION"); // }

    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      if (peek() && peek().type === "IF") {
        alternate = parseIfStatement(); // else if
      } else {
        consume("PUNCTUATION"); // {
        const elseBody: Statement[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === "}")
        ) {
          elseBody.push(parseStatement());
        }
        consume("PUNCTUATION"); // }
        alternate = {
          type: "IfStatement",
          test: { type: "Literal", value: 1 }, // else: test siempre true
          consequent: elseBody,
        };
      }
    }

    return { type: "IfStatement", test, consequent, alternate };
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

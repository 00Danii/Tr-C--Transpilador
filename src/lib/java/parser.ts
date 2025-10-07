import { Expression, IfStatement, Program, Statement } from "../ast";
import { Token } from "./lexer";

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
    // Busca la clase principal
    consume("PUBLIC");
    consume("CLASS");
    const className = consume("IDENTIFIER").value;
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseClassMember());
    }
    consume("PUNCTUATION"); // }
    return { type: "Program", body };
  }

  function parseClassMember(): Statement {
    // Busca el método main o métodos adicionales
    if (
      peek().type === "PUBLIC" &&
      peek(1).type === "STATIC" &&
      peek(2).type === "VOID" &&
      peek(3).type === "MAIN"
    ) {
      return parseMainMethod();
    }
    // Aquí podrías agregar parseo de otros métodos
    throw new Error("Solo se soporta el método main en esta versión");
  }

  function parseMainMethod(): Statement {
    consume("PUBLIC");
    consume("STATIC");
    consume("VOID");
    consume("MAIN");
    consume("PUNCTUATION"); // (
    consume("STRING_TYPE"); // String
    consume("PUNCTUATION"); // [
    consume("PUNCTUATION"); // ]
    consume("IDENTIFIER"); // args
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return { type: "MainMethod", body };
  }

  function parseStatement(): Statement {
    const token = peek();

    // Soporte para comentarios de línea y bloque
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    // Soporte para declaraciones de variables
    if (
      ["INT_TYPE", "DOUBLE_TYPE", "BOOLEAN_TYPE", "STRING_TYPE"].includes(
        peek().type
      )
    ) {
      return parseVariableDeclaration();
    }

    // Soporte para System.out.println y System.out.print
    if (peek().type === "PRINT") {
      return parsePrintStatement();
    }

    // Soporte para if, else if, else
    if (peek().type === "IF") {
      return parseIfStatement();
    }

    // Soporte para do while
    if (peek().type === "DO") {
      return parseDoWhileStatement();
    }

    // Soporte para Incremento y decremento (++, --)
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

    // Soporte para while
    if (peek().type === "WHILE") {
      return parseWhileStatement();
    }

    // Si no es ningún caso especial, intenta parsear una expresión
    if (
      token.type === "IDENTIFIER" ||
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "TRUE" ||
      token.type === "FALSE"
    ) {
      const expr = parseExpression();
      // Si hay punto y coma, consúmelo
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return { type: "ExpressionStatement", expression: expr };
    }

    throw new Error(`[NO SOPORTADO: ${token.type}, valor: ${token.value}]`);
  }

  function parseWhileStatement(): Statement {
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

  function parseDoWhileStatement(): Statement {
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
    consume("PUNCTUATION"); // ;
    return { type: "DoWhileStatement", body, test };
  }

  function parseIfStatement(): Statement {
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
          test: { type: "Literal", value: true }, // else: test siempre true
          consequent: elseBody,
        };
      }
    }

    return { type: "IfStatement", test, consequent, alternate };
  }

  function parsePrintStatement(): Statement {
    consume("PRINT");
    consume("PUNCTUATION"); // (
    const args: Expression[] = [];
    if (peek().type !== "PUNCTUATION" || peek().value !== ")") {
      args.push(parseExpression());
      while (peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
        args.push(parseExpression());
      }
    }
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // ;
    return {
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: { type: "Identifier", name: "print" },
        arguments: args,
      },
    };
  }

  function parseVariableDeclaration(): Statement {
    const varType = consume().type; // INT_TYPE, DOUBLE_TYPE, etc.
    const name = String(consume("IDENTIFIER").value);
    consume("OPERATOR"); // =
    const value = parseExpression();
    consume("PUNCTUATION"); // ;

    // Mapeo de tipo de token a tipo de Java
    const typeMap: Record<string, string> = {
      INT_TYPE: "int",
      DOUBLE_TYPE: "double",
      BOOLEAN_TYPE: "boolean",
      STRING_TYPE: "String",
    };

    return {
      type: "VariableDeclaration",
      kind: "",
      name,
      value,
    };
  }

  function parseExpression(): Expression {
    let left = parsePrimary();

    // Soporte para expresiones binarias (ej: x > 8)
    while (peek() && peek().type === "OPERATOR") {
      const operator = String(consume("OPERATOR").value);
      const right = parsePrimary();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();
    if (!token) throw new Error("Fin inesperada de la entrada");

    if (token.type === "NUMBER") {
      consume("NUMBER");
      return { type: "Literal", value: token.value };
    }
    if (token.type === "STRING") {
      consume("STRING");
      return { type: "Literal", value: token.value };
    }
    if (token.type === "TRUE" || token.type === "FALSE") {
      consume(token.type);
      return { type: "Literal", value: token.type === "TRUE" };
    }
    if (token.type === "IDENTIFIER") {
      consume("IDENTIFIER");
      return { type: "Identifier", name: String(token.value) };
    }
    throw new Error(`Expresión no soportada: ${token.type}`);
  }

  return parseProgram();
}

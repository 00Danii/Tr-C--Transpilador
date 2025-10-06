import { Expression, Program, Statement } from "../ast";
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

    throw new Error("Statement no soportado aún");
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
    // Puedes agregar más casos para identificadores, llamadas, etc.

    throw new Error(`Expresión no soportada: ${token.type}`);
  }

  return parseProgram();
}

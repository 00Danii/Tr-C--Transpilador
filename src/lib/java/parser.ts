import { Expression, Identifier, IfStatement, Program, Statement } from "../ast";
import { Token } from "./lexer";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(n = 0) {
    return tokens[current + n];
  }

  function consume(type?: string): Token {
    const token = tokens[current];
    if (!token) return { type: "EOF", value: "" } as Token;
    if (type && token.type !== type) {
      // En vez de throw, retorna un comentario especial
      return {
        type: "ERROR",
        value: `[NO SOPORTADO: se esperaba ${type}, pero se obtuvo ${token.type}]`,
      } as Token;
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
    if (
      peek().type === "PUBLIC" &&
      peek(1).type === "STATIC" &&
      peek(2).type === "VOID" &&
      peek(3).type === "MAIN"
    ) {
      return parseMainMethod();
    }
    return { type: "CommentStatement", value: "[NO SOPORTADO: solo main]" };
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

    // Comentarios
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    // Bloques independientes
    if (token.type === "PUNCTUATION" && token.value === "{") {
      return { type: "BlockStatement", body: parseBlock() };
    }

    // Declaración de variable
    if (
      ["INT_TYPE", "DOUBLE_TYPE", "BOOLEAN_TYPE", "STRING_TYPE"].includes(
        token.type
      )
    ) {
      return parseVariableDeclaration();
    }

    // Print
    if (token.type === "PRINT") {
      return parsePrintStatement();
    }

    // If
    if (token.type === "IF") {
      return parseIfStatement();
    }

    // Do While
    if (token.type === "DO") {
      return parseDoWhileStatement();
    }

    // While
    if (token.type === "WHILE") {
      return parseWhileStatement();
    }

    // For
    if (token.type === "FOR") {
      return parseForStatement();
    }

    // Try-Catch-Finally
    if (token.type === "TRY") {
      return parseTryStatement();
    }

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

    // Si es expresión suelta
    if (
      token.type === "IDENTIFIER" ||
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "TRUE" ||
      token.type === "FALSE" ||
      (token.type === "PUNCTUATION" && token.value === "(")
    ) {
      const expr = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return { type: "ExpressionStatement", expression: expr };
    }

    // No soportado
    consume();
    return {
      type: "CommentStatement",
      value: `[NO SOPORTADO: ${token.type}, valor: ${token.value}]`,
    };
  }

  function parseBlock(): Statement[] {
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return body;
  }

  function parseForStatement(): Statement {
    consume("FOR");
    consume("PUNCTUATION"); // (
    let init: Statement | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ";")) {
      init = parseForInitOrUpdate();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
    } else {
      consume("PUNCTUATION");
    }
    let test: Expression | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ";")) {
      test = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
    } else {
      consume("PUNCTUATION");
    }
    let update: Statement | null = null;
    if (peek() && !(peek().type === "PUNCTUATION" && peek().value === ")")) {
      update = parseForInitOrUpdate();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ")") {
        consume("PUNCTUATION");
      }
    } else {
      consume("PUNCTUATION");
    }
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return { type: "ForStatement", init, test, update, body };
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
      token.type === "INT_TYPE" ||
      token.type === "DOUBLE_TYPE" ||
      token.type === "BOOLEAN_TYPE" ||
      token.type === "STRING_TYPE"
    ) {
      return parseVariableDeclaration();
    }
    // ExpressionStatement
    const expr = parseExpression();
    return { type: "ExpressionStatement", expression: expr };
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
          test: { type: "Literal", value: true },
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
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === ")")) {
      args.push(parseExpression());
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
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
    const varTypeToken = consume(); // INT_TYPE, DOUBLE_TYPE, etc.
    let isArray = false;

    // Detecta int[] o double[]
    if (peek() && peek().type === "PUNCTUATION" && peek().value === "[") {
      consume("PUNCTUATION"); // [
      consume("PUNCTUATION"); // ]
      isArray = true;
    }

    const name = String(consume("IDENTIFIER").value);

    consume("OPERATOR"); // =

    // Soporte para inicialización de arreglos: {1, 2, 3}
    let value: Expression;
    if (
      isArray &&
      peek() &&
      peek().type === "PUNCTUATION" &&
      peek().value === "{"
    ) {
      consume("PUNCTUATION"); // {
      const elements: Expression[] = [];
      while (peek() && peek().type !== "PUNCTUATION" && peek().value !== "}") {
        elements.push(parseExpression());
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // }
      value = { type: "ArrayExpression", elements };
    } else {
      value = parseExpression();
    }

    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
      consume("PUNCTUATION");
    }

    const typeMap: Record<string, string> = {
      INT_TYPE: isArray ? "int[]" : "int",
      DOUBLE_TYPE: isArray ? "double[]" : "double",
      BOOLEAN_TYPE: isArray ? "boolean[]" : "boolean",
      STRING_TYPE: isArray ? "String[]" : "String",
    };

    return {
      type: "VariableDeclaration",
      kind: typeMap[varTypeToken.type] || varTypeToken.type,
      name,
      value,
    };
  }

  function parseTryStatement(): Statement {
    consume("TRY");
    const block = parseBlock();

    let handler;
    if (peek() && peek().type === "CATCH") {
      consume("CATCH");
      consume("PUNCTUATION"); // (
      let paramType = null;
      if (
        peek() &&
        (peek().type === "IDENTIFIER" ||
          ["INT_TYPE", "DOUBLE_TYPE", "BOOLEAN_TYPE", "STRING_TYPE"].includes(
            peek().type
          ))
      ) {
        paramType = consume().value;
      }
      let paramName = null;
      if (peek() && peek().type === "IDENTIFIER") {
        paramName = consume("IDENTIFIER").value;
      }
      consume("PUNCTUATION"); // )
      const body = parseBlock();
      handler = {
        param: {
          type: "Identifier",
          name:
            typeof paramName === "string" ? paramName : String(paramName ?? ""),
          javaType:
            typeof paramType === "string" ? paramType : String(paramType ?? ""),
        } as Identifier,
        body,
      };
    }

    let finalizer;
    if (peek() && peek().type === "FINALLY") {
      consume("FINALLY");
      finalizer = parseBlock();
    }

    return { type: "TryStatement", block, handler, finalizer };
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
    if (!token)
      return { type: "CommentStatement", value: "[NO SOPORTADO: EOF]" };

    // Arreglos: [1, 2, x]
    if (token.type === "PUNCTUATION" && token.value === "[") {
      consume("PUNCTUATION"); // [
      const elements: Expression[] = [];
      while (
        peek() &&
        !(peek().type === "PUNCTUATION" && peek().value === "]")
      ) {
        elements.push(parseExpression());
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // ]
      return { type: "ArrayExpression", elements };
    }

    // Números negativos
    if (token.type === "OPERATOR" && token.value === "-") {
      consume("OPERATOR");
      const next = parsePrimary();
      if (next.type === "Literal" && typeof next.value === "number") {
        return { type: "Literal", value: -next.value };
      }
      return { type: "UnaryExpression", operator: "-", argument: next };
    }

    // true/false
    if (token.type === "TRUE") {
      consume();
      return { type: "Literal", value: true };
    }
    if (token.type === "FALSE") {
      consume();
      return { type: "Literal", value: false };
    }

    if (token.type === "NUMBER" || token.type === "STRING") {
      consume();
      return { type: "Literal", value: token.value };
    }

    if (token.type === "IDENTIFIER") {
      consume();
      let expr: Expression = { type: "Identifier", name: String(token.value) };

      // Acceso a arreglo: arr[0]
      while (peek() && peek().type === "PUNCTUATION" && peek().value === "[") {
        consume("PUNCTUATION"); // [
        const property = parseExpression();
        consume("PUNCTUATION"); // ]
        expr = {
          type: "MemberExpression",
          object: expr,
          property,
        };
      }

      // Llamada a función
      if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
        consume("PUNCTUATION"); // (
        const args: Expression[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          args.push(parseExpression());
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION");
          }
        }
        consume("PUNCTUATION"); // )
        return {
          type: "CallExpression",
          callee: expr,
          arguments: args,
        };
      }

      return expr;
    }

    // Función flecha con paréntesis
    if (token.type === "PUNCTUATION" && token.value === "(") {
      let i = 1;
      while (
        peek(i) &&
        !(peek(i).type === "PUNCTUATION" && peek(i).value === ")")
      ) {
        i++;
      }
      if (peek(i + 1) && peek(i + 1).type === "ARROW") {
        consume("PUNCTUATION"); // (
        const params: string[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          if (peek().type === "IDENTIFIER") {
            params.push(String(consume("IDENTIFIER").value));
            if (
              peek() &&
              peek().type === "PUNCTUATION" &&
              peek().value === ","
            ) {
              consume("PUNCTUATION");
            }
          } else {
            consume();
          }
        }
        consume("PUNCTUATION"); // )
        consume("ARROW");
        const body = parseExpression();
        return { type: "LambdaExpression", params, body };
      }
    }

    return {
      type: "CommentStatement",
      value: `[NO SOPORTADO: ${token.type}, valor: ${token.value}]`,
    };
  }

  return parseProgram();
}

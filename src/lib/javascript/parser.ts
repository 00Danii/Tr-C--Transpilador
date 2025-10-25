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
  TryStatement,
  SwitchStatement,
  SwitchCase,
  ArrayKeyValue,
  MethodDefinition,
  PropertyDefinition,
  ClassDeclaration,
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

    // Soporte para try-catch-finally
    if (token.type === "TRY") return parseTryStatement();

    // Soporte para switch-case
    if (token.type === "SWITCH") return parseSwitchStatement();

    // Soporte para CLASES
    if (token.type === "CLASS") return parseClassDeclaration();

    return parseExpressionStatement();
  }

  function parseClassDeclaration(): ClassDeclaration {
    consume("CLASS");
    const name = String(consume("IDENTIFIER").value);
    let superClass: Identifier | undefined;

    if (peek() && peek().type === "EXTENDS") {
      consume("EXTENDS");
      superClass = {
        type: "Identifier",
        name: String(consume("IDENTIFIER").value),
      };
    }

    consume("PUNCTUATION"); // {
    const body: (MethodDefinition | PropertyDefinition)[] = [];

    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      if (peek().type === "CONSTRUCTOR") {
        consume("CONSTRUCTOR");
        consume("PUNCTUATION"); // (
        const params: string[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          params.push(String(consume("IDENTIFIER").value));
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION");
          }
        }
        consume("PUNCTUATION"); // )
        consume("PUNCTUATION"); // {
        const methodBody: Statement[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === "}")
        ) {
          methodBody.push(parseStatement());
        }
        consume("PUNCTUATION"); // }

        body.push({
          type: "MethodDefinition",
          key: { type: "Identifier", name: "constructor" },
          value: { type: "FunctionExpression", params, body: methodBody },
          kind: "constructor",
          static: false,
        });
      } else if (peek().type === "IDENTIFIER") {
        const methodName = String(consume("IDENTIFIER").value);
        consume("PUNCTUATION"); // (
        const params: string[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          params.push(String(consume("IDENTIFIER").value));
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION");
          }
        }
        consume("PUNCTUATION"); // )
        consume("PUNCTUATION"); // {
        const methodBody: Statement[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === "}")
        ) {
          methodBody.push(parseStatement());
        }
        consume("PUNCTUATION"); // }

        body.push({
          type: "MethodDefinition",
          key: { type: "Identifier", name: methodName },
          value: { type: "FunctionExpression", params, body: methodBody },
          kind: "method",
          static: false,
        });
      }
    }

    consume("PUNCTUATION"); // }
    return { type: "ClassDeclaration", name, superClass, body };
  }

  function parseSwitchStatement(): SwitchStatement {
    consume("SWITCH");
    consume("PUNCTUATION"); // (
    const discriminant = parseExpression();
    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // {
    const cases: SwitchCase[] = [];
    let defaultCase: Statement[] | undefined;
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      if (peek().type === "CASE") {
        consume("CASE");
        const test = parseExpression();
        consume("PUNCTUATION"); // :
        const consequent: Statement[] = [];
        while (
          peek() &&
          peek().type !== "CASE" &&
          peek().type !== "DEFAULT" &&
          !(peek().type === "PUNCTUATION" && peek().value === "}")
        ) {
          // Opcional: consume break;
          if (peek().type === "BREAK") {
            consume("BREAK");
            if (
              peek() &&
              peek().type === "PUNCTUATION" &&
              peek().value === ";"
            ) {
              consume("PUNCTUATION");
            }
            continue;
          }
          consequent.push(parseStatement());
        }
        cases.push({ test, consequent });
      } else if (peek().type === "DEFAULT") {
        consume("DEFAULT");
        consume("PUNCTUATION"); // :
        defaultCase = [];
        while (
          peek() &&
          peek().type !== "CASE" &&
          !(peek().type === "PUNCTUATION" && peek().value === "}")
        ) {
          if (peek().type === "BREAK") {
            consume("BREAK");
            if (
              peek() &&
              peek().type === "PUNCTUATION" &&
              peek().value === ";"
            ) {
              consume("PUNCTUATION");
            }
            continue;
          }
          defaultCase.push(parseStatement());
        }
      } else {
        consume();
      }
    }
    consume("PUNCTUATION"); // }
    return {
      type: "SwitchStatement",
      discriminant,
      cases,
      defaultCase,
    };
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
      const arg = parseExpression();
      args.push(arg);
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

    // // Soporte para identificadores y acceso a propiedades: obj.prop
    // if (token.type === "IDENTIFIER") {
    //   const name = String(consume("IDENTIFIER").value);

    //   // Verificar si es acceso a propiedad: obj.prop
    //   if (peek() && peek().type === "PUNCTUATION" && peek().value === ".") {
    //     consume("PUNCTUATION"); // .
    //     const property = String(consume("IDENTIFIER").value);

    //     return {
    //       type: "MemberExpression",
    //       object: { type: "Identifier", name },
    //       property: { type: "Identifier", name: property },
    //       computed: false,
    //     } as any;
    //   }

    //   return { type: "Identifier", name };
    // }

    // SOPORTE PARA THIS
    if (token.type === "THIS") {
      consume("THIS");

      if (peek() && peek().type === "PUNCTUATION" && peek().value === ".") {
        consume("PUNCTUATION"); // .
        const property = String(consume("IDENTIFIER").value);

        return {
          type: "MemberExpression",
          object: { type: "Identifier", name: "this" },
          property: { type: "Identifier", name: property },
          computed: false,
        } as any;
      }

      return { type: "Identifier", name: "this" };
    }

    // Soporte para objetos literales: { a: 1, "b": 2 }
    if (token.type === "PUNCTUATION" && token.value === "{") {
      consume("PUNCTUATION"); // {
      const elements: (Expression | ArrayKeyValue)[] = [];
      while (
        peek() &&
        !(peek().type === "PUNCTUATION" && peek().value === "}")
      ) {
        const keyTok = peek();
        let keyExpr: Expression;
        // clave como string o numero => Literal
        if (keyTok.type === "STRING" || keyTok.type === "NUMBER") {
          consume();
          keyExpr = { type: "Literal", value: keyTok.value } as any;
        } else if (keyTok.type === "IDENTIFIER") {
          // clave sin comillas: Identifier
          consume();
          keyExpr = { type: "Identifier", name: String(keyTok.value) } as any;
        } else {
          throw new Error(
            `Clave de propiedad inesperada: ${keyTok.type}, valor: ${keyTok.value}`
          );
        }

        // si hay ":", es forma normal key: value
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ":") {
          consume("PUNCTUATION"); // :
          const valueExpr = parseExpression();
          elements.push({
            type: "ArrayKeyValue",
            key: keyExpr,
            value: valueExpr,
          });
        } else {
          // shorthand: { a } -> { a: a }
          elements.push({
            type: "ArrayKeyValue",
            key: keyExpr,
            value: keyExpr,
          });
        }

        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // }
      return { type: "ArrayExpression", elements } as any;
    }

    // Soporte para arreglos: [1, 2, x]
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

    // Soporte para números negativos
    if (token.type === "OPERATOR" && token.value === "-") {
      consume("OPERATOR");
      const next = parsePrimary();
      if (next.type === "Literal" && typeof next.value === "number") {
        return { type: "Literal", value: -next.value };
      }
      // Si es una expresión, crea un UnaryExpression
      return { type: "UnaryExpression", operator: "-", argument: next };
    }

    // Soporte para true y false
    if (token.type === "TRUE") {
      consume();
      return { type: "Literal", value: true };
    }
    if (token.type === "FALSE") {
      consume();
      return { type: "Literal", value: false };
    }

    if (
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "CHAR"
    ) {
      consume();
      return { type: "Literal", value: token.value };
    }

    if (token.type === "IDENTIFIER") {
      consume();
      let expr: Expression = { type: "Identifier", name: String(token.value) };

      // Loop unificado para acceso a miembros (. y [])
      while (true) {
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ".") {
          consume("PUNCTUATION"); // .
          const property = consume("IDENTIFIER");
          expr = {
            type: "MemberExpression",
            object: expr,
            property: { type: "Identifier", name: String(property.value) },
            computed: false,
          };
        } else if (
          peek() &&
          peek().type === "PUNCTUATION" &&
          peek().value === "["
        ) {
          consume("PUNCTUATION"); // [
          const property = parseExpression();
          consume("PUNCTUATION"); // ]
          expr = {
            type: "MemberExpression",
            object: expr,
            property,
            computed: true,
          };
        } else {
          break;
        }
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
            consume("PUNCTUATION"); // ,
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

    // Soporte para función flecha con paréntesis
    if (token.type === "PUNCTUATION" && token.value === "(") {
      // Busca el índice del paréntesis de cierre
      let i = 1;
      while (
        peek(i) &&
        !(peek(i).type === "PUNCTUATION" && peek(i).value === ")")
      ) {
        i++;
      }
      // El siguiente token debe ser ARROW
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
            throw new Error(
              `Se esperaba IDENTIFIER, pero se obtuvo ${peek().type}, valor: ${
                peek().value
              }`
            );
          }
        }
        consume("PUNCTUATION"); // )
        consume("ARROW");
        const body = parseExpression();
        return { type: "LambdaExpression", params, body };
      }
    }

    // //! Soporte para función flecha sin paréntesis
    // if (token.type === "IDENTIFIER" && peek(1) && peek(1).type === "ARROW") {
    //   const params = [String(consume("IDENTIFIER").value)];
    //   consume("ARROW");
    //   const body = parseExpression();
    //   return { type: "LambdaExpression", params, body };
    // }

    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  function parseTryStatement(): TryStatement {
    consume("TRY");
    const block = parseBlock();

    let handler;
    if (peek() && peek().type === "CATCH") {
      consume("CATCH");
      consume("PUNCTUATION"); // (
      const param = {
        type: "Identifier" as const,
        name: String(consume("IDENTIFIER").value),
      };
      consume("PUNCTUATION"); // )
      const body = parseBlock();
      handler = { param, body };
    }

    let finalizer;
    if (peek() && peek().type === "FINALLY") {
      consume("FINALLY");
      finalizer = parseBlock();
    }

    return { type: "TryStatement", block, handler, finalizer };
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

  return parseProgram();
}

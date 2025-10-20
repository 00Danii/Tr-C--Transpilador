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
  TryStatement,
  ClassDeclaration,
  MethodDefinition,
  PropertyDefinition,
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
    while (peek()) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
    }
    return { type: "Program", body: body.filter(Boolean) };
  }

  function parseStatement(): Statement | undefined {
    while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    const token = peek();
    if (!token) return; // para evitar errores al final
    if (token.type === "LINE_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }
    if (token.type === "DEF") return parseFunctionDeclaration();
    if (token.type === "RETURN") return parseReturnStatement();
    if (token.type === "IF") return parseIfStatement();
    if (token.type === "WHILE") return parseWhileStatement();
    if (token.type === "FOR") return parseForStatement();

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

    // Si es un bloque try
    if (token.type === "TRY") return parseTryStatement();

    // Si es una clase
    if (token.type === "CLASS") return parseClassDeclaration();

    // Si es expresión simple
    return parseExpressionStatement();
  }

  function parseClassDeclaration(): ClassDeclaration {
    consume("CLASS");
    const name = String(consume("IDENTIFIER").value);
    let superClass: Identifier | undefined;

    // Herencia: class Persona(Animal):
    if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
      consume("PUNCTUATION"); // (
      superClass = {
        type: "Identifier",
        name: String(consume("IDENTIFIER").value),
      };
      consume("PUNCTUATION"); // )
    }

    consume("PUNCTUATION"); // :

    // Consumir newlines e indents
    while (peek() && (peek().type === "NEWLINE" || peek().type === "INDENT")) {
      consume();
    }

    const body: (MethodDefinition | PropertyDefinition)[] = [];

    // Parsear métodos dentro de la clase
    while (peek() && peek().type !== "DEDENT" && peek().type) {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");

      if (!peek()) break;

      if (peek().type === "DEF") {
        // DELEGAR a parseMethodDeclaration en vez de manejar internamente
        const func = parseMethodDeclaration();

        // Convertir FunctionDeclaration a MethodDefinition
        const kind = func.name === "__init__" ? "constructor" : "method";

        body.push({
          type: "MethodDefinition",
          key: { type: "Identifier", name: func.name },
          value: {
            type: "FunctionExpression",
            params: func.params,
            body: func.body,
          },
          kind,
          static: false,
        });
      } else if (peek() && peek().type === "PASS") {
        consume("PASS");
        if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      } else if (peek() && peek().type === "DEDENT") {
        break;
      } else {
        // Saltar tokens que no entendemos
        consume();
      }
    }

    // Consumir DEDENT final si existe
    if (peek() && peek().type === "DEDENT") consume("DEDENT");

    return { type: "ClassDeclaration", name, superClass, body };
  }

  function parseTryStatement(): TryStatement {
    consume("TRY");
    consume("PUNCTUATION"); // :
    if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    consume("INDENT");
    const block: Statement[] = [];
    while (
      peek() &&
      peek().type !== "DEDENT" &&
      peek().type !== "EXCEPT" &&
      peek().type !== "FINALLY"
    ) {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (
        peek() &&
        peek().type !== "DEDENT" &&
        peek().type !== "EXCEPT" &&
        peek().type !== "FINALLY"
      ) {
        block.push(parseStatement());
      }
    }
    consume("DEDENT");

    let handler;
    if (peek() && peek().type === "EXCEPT") {
      consume("EXCEPT");
      let param: Identifier = { type: "Identifier", name: "e" };
      // Soporte para except Exception as e:
      if (peek() && peek().type === "IDENTIFIER") {
        // except Exception
        const excName = String(consume("IDENTIFIER").value);
        if (peek() && peek().type === "IDENTIFIER" && peek().value === "as") {
          consume("IDENTIFIER"); // as
          if (peek() && peek().type === "IDENTIFIER") {
            param = {
              type: "Identifier",
              name: String(consume("IDENTIFIER").value),
            };
          }
        } else {
          // except Exception:
          param = { type: "Identifier", name: excName };
        }
      }
      consume("PUNCTUATION"); // :
      if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      consume("INDENT");
      const body: Statement[] = [];
      while (peek() && peek().type !== "DEDENT" && peek().type !== "FINALLY") {
        while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
        if (peek() && peek().type !== "DEDENT" && peek().type !== "FINALLY") {
          body.push(parseStatement());
        }
      }
      consume("DEDENT");
      handler = { param, body };
    }

    let finalizer;
    if (peek() && peek().type === "FINALLY") {
      consume("FINALLY");
      consume("PUNCTUATION"); // :
      if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      consume("INDENT");
      finalizer = [];
      while (peek() && peek().type !== "DEDENT") {
        while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
        if (peek() && peek().type !== "DEDENT") {
          finalizer.push(parseStatement());
        }
      }
      consume("DEDENT");
    }

    return { type: "TryStatement", block, handler, finalizer };
  }
  function parseFunctionDeclaration(): FunctionDeclaration {
    consume("DEF");
    const name = String(consume("IDENTIFIER").value);
    consume("PUNCTUATION"); // (
    const params: string[] = [];

    while (peek() && (peek().type !== "PUNCTUATION" || peek().value !== ")")) {
      // CAMBIO: Aceptar tanto IDENTIFIER como SELF
      const paramToken = peek();
      if (paramToken.type === "IDENTIFIER" || paramToken.type === "SELF") {
        params.push(String(consume().value));
      } else {
        throw new Error(
          `Token inesperado en parámetros: ${paramToken.type}, valor: ${paramToken.value}`
        );
      }

      if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
      }
    }

    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // :
    if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    consume("INDENT"); // <-- Aquí empieza el bloque
    const body: Statement[] = [];
    while (peek() && peek().type !== "DEDENT") {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (peek() && peek().type !== "DEDENT") {
        body.push(parseStatement());
      }
    }
    consume("DEDENT"); // <-- Aquí termina el bloque
    return { type: "FunctionDeclaration", name, params, body };
  }

  function parseMethodDeclaration(): FunctionDeclaration {
    consume("DEF");
    const name = String(consume("IDENTIFIER").value);
    consume("PUNCTUATION"); // (
    const params: string[] = [];

    while (peek() && (peek().type !== "PUNCTUATION" || peek().value !== ")")) {
      const paramToken = peek();
      if (paramToken.type === "IDENTIFIER" || paramToken.type === "SELF") {
        params.push(String(consume().value));
      } else {
        throw new Error(
          `Token inesperado en parámetros: ${paramToken.type}, valor: ${paramToken.value}`
        );
      }

      if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
      }
    }

    consume("PUNCTUATION"); // )
    consume("PUNCTUATION"); // :

    // SÍ consumir NEWLINE e INDENT aquí - cada método tiene su propia indentación
    if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    if (peek() && peek().type === "INDENT") consume("INDENT"); // <-- AGREGAR ESTA LÍNEA

    const body: Statement[] = [];
    while (peek() && peek().type !== "DEDENT" && peek().type !== "DEF") {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (peek() && peek().type !== "DEDENT" && peek().type !== "DEF") {
        body.push(parseStatement());
      }
    }

    // SÍ consumir DEDENT aquí - termina la indentación del método
    if (peek() && peek().type === "DEDENT") consume("DEDENT"); // <-- AGREGAR ESTA LÍNEA

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
    if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    consume("INDENT");
    const consequent: Statement[] = [];
    while (
      peek() &&
      peek().type !== "DEDENT" &&
      peek().type !== "ELIF" &&
      peek().type !== "ELSE"
    ) {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (
        peek() &&
        peek().type !== "DEDENT" &&
        peek().type !== "ELIF" &&
        peek().type !== "ELSE"
      ) {
        consequent.push(parseStatement());
      }
    }
    consume("DEDENT");
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELIF") {
      consume("ELIF");
      const elifTest = parseExpression();
      consume("PUNCTUATION"); // :
      if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      consume("INDENT");
      const elifConsequent: Statement[] = [];
      while (
        peek() &&
        peek().type !== "DEDENT" &&
        peek().type !== "ELIF" &&
        peek().type !== "ELSE"
      ) {
        while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
        if (
          peek() &&
          peek().type !== "DEDENT" &&
          peek().type !== "ELIF" &&
          peek().type !== "ELSE"
        ) {
          elifConsequent.push(parseStatement());
        }
      }
      consume("DEDENT");
      let elifAlternate: Statement | IfStatement | undefined;
      if (peek() && peek().type === "ELIF") {
        elifAlternate = parseIfStatement();
      } else if (peek() && peek().type === "ELSE") {
        consume("ELSE");
        consume("PUNCTUATION"); // :
        if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
        consume("INDENT");
        const elseBody: Statement[] = [];
        while (peek() && peek().type !== "DEDENT") {
          while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
          if (peek() && peek().type !== "DEDENT") {
            elseBody.push(parseStatement());
          }
        }
        consume("DEDENT");
        elifAlternate = {
          type: "IfStatement",
          test: { type: "Literal", value: true },
          consequent: elseBody,
        };
      }
      alternate = {
        type: "IfStatement",
        test: elifTest,
        consequent: elifConsequent,
        alternate: elifAlternate,
      };
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      consume("PUNCTUATION"); // :
      if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      consume("INDENT");
      const elseBody: Statement[] = [];
      while (peek() && peek().type !== "DEDENT") {
        while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
        if (peek() && peek().type !== "DEDENT") {
          elseBody.push(parseStatement());
        }
      }
      consume("DEDENT");
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
    if (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    consume("INDENT");
    const body: Statement[] = [];
    while (peek() && peek().type !== "DEDENT") {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (peek() && peek().type !== "DEDENT") {
        body.push(parseStatement());
      }
    }
    consume("DEDENT");
    return { type: "WhileStatement", test, body };
  }

  function parseForStatement(): ForStatement {
    consume("FOR");
    const varName = String(consume("IDENTIFIER").value);
    consume("IN");
    const rangeExpr = parseExpression();
    consume("PUNCTUATION"); // :
    while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    consume("INDENT");
    const body: Statement[] = [];
    while (peek() && peek().type !== "DEDENT") {
      while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
      if (peek() && peek().type !== "DEDENT") {
        body.push(parseStatement());
      }
    }
    consume("DEDENT");
    return {
      type: "ForStatement",
      varName,
      rangeExpr,
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
    while (peek() && peek().type === "NEWLINE") consume("NEWLINE");
    const token = peek();

    // Soporte para objetos literales/diccionarios: { "a": 1, b: 2 }
    if (token.type === "PUNCTUATION" && token.value === "{") {
      consume("PUNCTUATION"); // {
      const elements: (Expression | any)[] = [];
      while (
        peek() &&
        !(peek().type === "PUNCTUATION" && peek().value === "}")
      ) {
        // parse key (STRING, NUMBER o IDENTIFIER)
        const keyTok = peek();
        let keyExpr: Expression;
        if (keyTok.type === "STRING" || keyTok.type === "NUMBER") {
          consume();
          keyExpr = { type: "Literal", value: keyTok.value } as Expression;
        } else if (keyTok.type === "IDENTIFIER") {
          consume();
          keyExpr = {
            type: "Identifier",
            name: String(keyTok.value),
          } as Expression;
        } else {
          throw new Error(
            `Clave de diccionario inesperada: ${keyTok.type}, valor: ${keyTok.value}`
          );
        }

        // si sigue ":" -> key: value
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ":") {
          consume("PUNCTUATION"); // :
          const valueExpr = parseExpression();
          elements.push({
            type: "ArrayKeyValue",
            key: keyExpr,
            value: valueExpr,
          });
        } else {
          // shorthand { a } -> { a: a }
          elements.push({
            type: "ArrayKeyValue",
            key: keyExpr,
            value: keyExpr,
          });
        }

        // separador opcional
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
          // permitir coma final: si siguiente es '}' se terminará en la condición del while
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
    if (token && token.type === "OPERATOR" && token.value === "-") {
      consume("OPERATOR");
      const next = parsePrimary();
      if (next.type === "Literal" && typeof next.value === "number") {
        return { type: "Literal", value: -next.value };
      }
      // Si es una expresión, crea un UnaryExpression
      return { type: "UnaryExpression", operator: "-", argument: next };
    }
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

    // AGREGAR: Soporte para el token SELF
    if (token.type === "SELF") {
      const id = {
        type: "Identifier",
        name: "self", // Convertir SELF a Identifier con name "self"
      } as Identifier;
      consume(); // Consumir el token SELF

      let expr: Expression = id;

      // Soporte para acceso a atributos: self.nombre
      while (peek() && peek().type === "PUNCTUATION" && peek().value === ".") {
        consume("PUNCTUATION"); // .
        const property = String(consume("IDENTIFIER").value);
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", name: property },
          computed: false,
        };
      }

      // Resto del código para acceso a arrays y llamadas...
      while (peek() && peek().type === "PUNCTUATION" && peek().value === "[") {
        consume("PUNCTUATION"); // [
        const property = parseExpression();
        consume("PUNCTUATION"); // ]
        expr = {
          type: "MemberExpression",
          object: expr,
          property,
          computed: true,
        };
      }

      if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
        consume("PUNCTUATION"); // (
        const args: Expression[] = [];
        if (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          args.push(parseExpression());
          while (
            peek() &&
            peek().type === "PUNCTUATION" &&
            peek().value === ","
          ) {
            consume("PUNCTUATION");
            args.push(parseExpression());
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

    if (token.type === "IDENTIFIER") {
      const id = {
        type: "Identifier",
        name: String(token.value),
      } as Identifier;
      consume();

      let expr: Expression = id;

      // Soporte para acceso a atributos: self.nombre o obj.metodo
      while (peek() && peek().type === "PUNCTUATION" && peek().value === ".") {
        consume("PUNCTUATION"); // .
        const property = String(consume("IDENTIFIER").value);
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", name: property },
          computed: false, // obj.prop es acceso directo
        };
      }

      // Soporte para acceso a arreglo: arr[0]
      while (peek() && peek().type === "PUNCTUATION" && peek().value === "[") {
        consume("PUNCTUATION"); // [
        const property = parseExpression();
        consume("PUNCTUATION"); // ]
        expr = {
          type: "MemberExpression",
          object: expr,
          property,
          computed: true, // arr[0] es acceso computed
        };
      }

      // Si sigue un paréntesis, es una llamada a función
      if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
        consume("PUNCTUATION"); // (
        const args: Expression[] = [];
        if (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          args.push(parseExpression());
          while (
            peek() &&
            peek().type === "PUNCTUATION" &&
            peek().value === ","
          ) {
            consume("PUNCTUATION");
            args.push(parseExpression());
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

    if (token.type === "OPERATOR" && token.value === "not") {
      consume();
      const argument = parsePrimary();
      return {
        type: "UnaryExpression",
        operator: "not",
        argument,
      };
    }

    // Soporte para funciones lambda
    if (token.type === "LAMBDA") {
      consume("LAMBDA");
      const params: string[] = [];
      // Parsea los parámetros hasta encontrar ':'
      while (peek() && peek().type === "IDENTIFIER") {
        params.push(String(consume("IDENTIFIER").value));
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // :
      const body = parseExpression();
      return { type: "LambdaExpression", params, body };
    }
    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  return parseProgram();
}

import { Token } from "./lexer";
import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
  ReturnStatement,
  ExpressionStatement,
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  TryStatement,
  BlockStatement,
  CommentStatement,
  BinaryExpression,
  Identifier,
  Literal,
  CallExpression,
  UnaryExpression,
  LambdaExpression,
  DoWhileStatement,
  SwitchStatement,
  SwitchCase,
  ArrayKeyValue,
  ClassDeclaration,
  MethodDefinition,
  PropertyDefinition,
} from "../ast";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(n = 0) {
    return tokens[current + n];
  }

  function consume(type?: string) {
    const token = tokens[current];
    if (type && token.type !== type) {
      throw new Error(
        `Token inesperado: ${token.type}, valor: ${token.value}, se esperaba: ${type}`
      );
    }
    current++;
    return token;
  }

  function parseProgram(): Program {
    const body: Statement[] = [];
    // Opcional: consume PHP_OPEN y PHP_CLOSE
    if (peek() && peek().type === "PHP_OPEN") consume("PHP_OPEN");
    while (peek() && peek().type !== "PHP_CLOSE") {
      body.push(parseStatement());
    }
    if (peek() && peek().type === "PHP_CLOSE") consume("PHP_CLOSE");
    return { type: "Program", body };
  }

  function parseStatement(): Statement {
    const token = peek();

    if (!token) return undefined;

    // Expresiones especiales: incremento y decremento
    // $i++;
    if (token.type === "VARIABLE" && peek(1)?.type === "INCREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
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

    // $i--;
    if (token.type === "VARIABLE" && peek(1)?.type === "DECREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
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

    // Comentarios
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    // Function declaration
    if (token.type === "FUNCTION") return parseFunctionDeclaration();

    // If statement
    if (token.type === "IF") return parseIfStatement();

    // While
    if (token.type === "WHILE") return parseWhileStatement();

    // For
    if (token.type === "FOR") return parseForStatement();

    // Try/catch/finally
    if (token.type === "TRY") return parseTryStatement();

    // Return
    if (token.type === "RETURN") {
      consume("RETURN");
      const argument = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return { type: "ReturnStatement", argument };
    }

    // Print (echo)
    if (token.type === "PRINT") {
      consume("PRINT");
      const args: Expression[] = [];
      args.push(parseExpression());
      while (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
        args.push(parseExpression());
      }
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "print" },
          arguments: args,
        },
      };
    }

    // Variable declaration SOLO si es asignación
    if (
      token.type === "VARIABLE" &&
      peek(1) &&
      peek(1).type === "OPERATOR" &&
      peek(1).value === "="
    ) {
      return parseVariableDeclaration();
    }

    // Expression statement
    if (
      token.type === "IDENTIFIER" ||
      token.type === "VARIABLE" ||
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "TRUE" ||
      token.type === "FALSE" ||
      token.type === "NULL"
    ) {
      const expr = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return { type: "ExpressionStatement", expression: expr };
    }

    // Bloque
    if (token.type === "PUNCTUATION" && token.value === "{") {
      return { type: "BlockStatement", body: parseBlock() };
    }

    // do { } while ();
    if (token.type === "DO") return parseDoWhileStatement();

    if (token.type === "SWITCH") return parseSwitchStatement();

    // Clases
    if (token.type === "CLASS") return parseClassDeclaration();

    // Por defecto, consume y retorna undefined
    consume();
    return undefined;
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
      let visibility: "public" | "private" | "protected" = "public";
      let isStatic = false;

      // Parse visibility
      if (
        peek() &&
        (peek().type === "PUBLIC" ||
          peek().type === "PRIVATE" ||
          peek().type === "PROTECTED")
      ) {
        visibility = consume().value as "public" | "private" | "protected";
      }

      // Parse static
      if (peek() && peek().type === "STATIC") {
        consume("STATIC");
        isStatic = true;
      }

      // Parse function
      if (peek() && peek().type === "FUNCTION") {
        consume("FUNCTION");

        let methodName = String(consume("IDENTIFIER").value);
        // Si es __construct, cambiar el nombre para el AST
        const kind = methodName === "__construct" ? "constructor" : "method";

        consume("PUNCTUATION"); // (
        const params: string[] = [];
        while (
          peek() &&
          !(peek().type === "PUNCTUATION" && peek().value === ")")
        ) {
          if (peek().type === "VARIABLE") {
            params.push(String(consume("VARIABLE").value).slice(1)); // Quitar $
          }
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
          kind,
          static: isStatic,
          visibility,
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

  function parseBlock(): Statement[] {
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return body;
  }

  function parseFunctionDeclaration(): FunctionDeclaration {
    consume("FUNCTION");
    const name = consume("IDENTIFIER").value as string;
    consume("PUNCTUATION"); // (
    const params: string[] = [];
    while (peek() && peek().type !== "PUNCTUATION" && peek().value !== ")") {
      if (peek().type === "VARIABLE") {
        params.push(String(consume("VARIABLE").value).slice(1));
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      } else {
        throw new Error(`Se esperaba VARIABLE en parámetros`);
      }
    }
    consume("PUNCTUATION"); // )
    const body = parseBlock();
    return { type: "FunctionDeclaration", name, params, body };
  }

  function parseVariableDeclaration(): VariableDeclaration {
    const token = consume("VARIABLE");
    const name = String(token.value).slice(1);
    let value: Expression = { type: "Literal", value: null };
    if (peek() && peek().type === "OPERATOR" && peek().value === "=") {
      consume("OPERATOR");
      value = parseExpression();
    }
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
      consume("PUNCTUATION");
    return { type: "VariableDeclaration", kind: "", name, value };
  }

  function parseIfStatement(): IfStatement {
    consume("IF");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const consequent = parseBlock();
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELSEIF") {
      alternate = parseElseIfStatement();
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      const elseBlock = parseBlock();
      alternate = {
        type: "IfStatement",
        test: { type: "Literal", value: true },
        consequent: elseBlock,
      };
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseElseIfStatement(): IfStatement {
    consume("ELSEIF");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const consequent = parseBlock();
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELSEIF") {
      alternate = parseElseIfStatement();
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      const elseBlock = parseBlock();
      alternate = {
        type: "IfStatement",
        test: { type: "Literal", value: true },
        consequent: elseBlock,
      };
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseWhileStatement(): WhileStatement {
    consume("WHILE");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const body = parseBlock();
    return { type: "WhileStatement", test, body };
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
    // $i++;
    if (token.type === "VARIABLE" && peek(1)?.type === "INCREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
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
    // $i--;
    if (token.type === "VARIABLE" && peek(1)?.type === "DECREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
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
    // VariableDeclaration SOLO si es asignación
    if (
      token.type === "VARIABLE" &&
      peek(1) &&
      peek(1).type === "OPERATOR" &&
      peek(1).value === "="
    ) {
      // Transforma VariableDeclaration a ExpressionStatement con BinaryExpression
      // Para cumplir con la estructura del ForStatement
      const varDecl = parseVariableDeclaration();
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name: varDecl.name },
          right: varDecl.value,
        },
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
    const body = parseBlock();
    return { type: "ForStatement", init, test, update, body };
  }

  function parseTryStatement(): TryStatement {
    consume("TRY");
    const block = parseBlock();
    let handler;
    if (peek() && peek().type === "CATCH") {
      consume("CATCH");
      consume("PUNCTUATION"); // (
      // EXCEPTION es opcional
      if (peek() && peek().type === "EXCEPTION") {
        consume("EXCEPTION"); // Exception
      }
      const param: Identifier = {
        type: "Identifier",
        name: String(consume("VARIABLE").value).slice(1),
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

  function parseExpression(inArray = false): Expression {
    return parseBinaryExpression(inArray);
  }

  function parseBinaryExpression(inArray = false): Expression {
    let left = parsePrimary();
    while (peek() && peek().type === "OPERATOR") {
      const operator = consume("OPERATOR").value as string;
      const right = parsePrimary();
      if (operator === "=>" && inArray) {
        left = { type: "ArrayKeyValue", key: left, value: right };
      } else {
        left = { type: "BinaryExpression", operator, left, right };
      }
    }
    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();

    if (!token) throw new Error("Token inesperado: EOF");

    // Soporte para array(...) de PHP
    if (token.type === "ARRAY") {
      consume("ARRAY");
      consume("PUNCTUATION"); // (
      const elements: Expression[] = [];
      while (
        peek() &&
        !(peek().type === "PUNCTUATION" && peek().value === ")")
      ) {
        elements.push(parseExpression());
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // )
      return { type: "ArrayExpression", elements } as any;
    }

    // Soporte para arreglos literales: [1, 2, 3]
    if (token.type === "PUNCTUATION" && token.value === "[") {
      consume("PUNCTUATION"); // [
      const elements: (Expression | ArrayKeyValue)[] = [];
      while (
        peek() &&
        !(peek().type === "PUNCTUATION" && peek().value === "]")
      ) {
        const keyOrValue = parseExpression(true);
        elements.push(keyOrValue);
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      }
      consume("PUNCTUATION"); // ]
      return { type: "ArrayExpression", elements } as any;
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
    if (token.type === "NULL") {
      consume();
      return { type: "Literal", value: null };
    }

    // Soporte para variables 
    // acceso a elementos: $arr[0]
    // acceso a propiedades: $this->prop
    if (token.type === "VARIABLE") {
      consume();
      let expr: Expression = {
        type: "Identifier",
        name: String(token.value).slice(1),
      };

      // Acceso a propiedades: $this->prop
      while (peek() && peek().type === "ARROW") {
        consume("ARROW"); // ->
        const property = String(consume("IDENTIFIER").value);
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", name: property },
          computed: false,
        };
      }

      // Acceso a elementos: $arr[0]
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

      return expr;
    }

    if (token.type === "IDENTIFIER") {
      const name = consume().value as string;

      let expr: Expression = { type: "Identifier", name };

      // Acceso a elementos: arr[0]
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
          peek().type !== "PUNCTUATION" &&
          peek().value !== ")"
        ) {
          args.push(parseExpression());
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION");
          }
        }
        consume("PUNCTUATION"); // )
        return {
          type: "CallExpression",
          callee: { type: "Identifier", name },
          arguments: args,
        };
      }
      return expr;
    }

    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  return parseProgram();
}

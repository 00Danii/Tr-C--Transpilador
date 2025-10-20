import {
  Program,
  Statement,
  FunctionDeclaration,
  ReturnStatement,
  ExpressionStatement,
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  CommentStatement,
  Expression,
  CallExpression,
  Identifier,
  Literal,
  ArrayKeyValue,
} from "../ast";

export function generateJs(
  node: Program | Statement | Expression | ArrayKeyValue | undefined
): string {
  switch (node?.type) {
    case "Program":
      return node.body.map(generateJs).join("");

    case "FunctionDeclaration":
      return `function ${node.name}(${node.params.join(", ")}) {\n${node.body
        .map((stmt) => "  " + generateJs(stmt).replace(/\n/g, ""))
        .join("\n")}\n}\n`;

    case "ReturnStatement":
      return `return ${generateJs(node.argument)};\n`;

    case "VariableDeclaration":
      return `${node.kind ? node.kind + " " : ""}${node.name} = ${generateJs(
        node.value
      )};\n`;

    case "ExpressionStatement":
      // Si es asignación
      if (
        node.expression.type === "BinaryExpression" &&
        node.expression.operator === "=" &&
        node.expression.left.type === "Identifier"
      ) {
        // Si el lado derecho es una LambdaExpression, usa const
        if (node.expression.right.type === "LambdaExpression") {
          return `const ${node.expression.left.name} = ${generateJs(
            node.expression.right
          )};\n`;
        }

        return `${node.expression.left.name} = ${generateJs(
          node.expression.right
        )};\n`;
      }
      return `${generateJs(node.expression)};\n`;

    case "IfStatement": {
      let code = `if (${generateJs(node.test)}) {\n`;
      code += node.consequent.map((s) => "  " + generateJs(s)).join("");
      code += "}\n";
      if (node.alternate) {
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          node.alternate.test.value === true
        ) {
          // Es un else
          code += `else {\n${node.alternate.consequent
            .map((s) => "  " + generateJs(s))
            .join("")}}\n`;
        } else if (node.alternate.type === "IfStatement") {
          // Es un else if
          code += `else ${generateJs(node.alternate)}`;
        } else {
          if (Array.isArray(node.alternate)) {
            code += `else {\n${node.alternate
              .map((s) => "  " + generateJs(s))
              .join("")}}\n`;
          } else {
            code += `else {\n  ${generateJs(node.alternate)}\n}\n`;
          }
        }
      }
      return code;
    }

    case "WhileStatement":
      return `while (${generateJs(node.test)}) {\n${node.body
        .map((s) => "  " + generateJs(s))
        .join("")}}\n`;

    case "ForStatement": {
      if (
        node.varName &&
        node.rangeExpr &&
        node.rangeExpr.type === "CallExpression" &&
        node.rangeExpr.callee.type === "Identifier" &&
        node.rangeExpr.callee.name === "range"
      ) {
        const args = node.rangeExpr.arguments.map(generateJs);
        let start = "0",
          end = "0",
          step = "1";
        if (args.length === 1) {
          // range(END)
          start = "0";
          end = args[0];
        } else if (args.length === 2) {
          // range(START, END)
          start = args[0];
          end = args[1];
        } else if (args.length === 3) {
          // range(START, END, STEP)
          start = args[0];
          end = args[1];
          step = args[2];
        }
        let cmp = step.startsWith("-") ? ">" : "<";
        let code = `for (${node.varName} = ${start}; ${node.varName} ${cmp} ${end}; ${node.varName} += ${step}) {\n`;
        code += node.body.map((s) => "  " + generateJs(s)).join("");
        code += "}\n";
        return code;
      }

      // Soporte para for clásico
      if (node.init && node.test && node.update) {
        return (
          `for (${generateJs(node.init).replace(/;\s*$/, "")}; ${generateJs(
            node.test
          )}; ${generateJs(node.update).replace(/;\s*$/, "")}) {\n` +
          node.body.map((s) => "  " + generateJs(s)).join("") +
          "}\n"
        );
      }

      return "// [NO SOPORTADO: for]\n";
    }

    case "CommentStatement":
      return `// ${node.value}\n`;

    case "CallExpression":
      // Si es print, conviértelo a console.log
      if (node.callee.type === "Identifier" && node.callee.name === "print") {
        return `console.log(${node.arguments.map(generateJs).join(", ")})`;
      }
      return `${generateJs(node.callee)}(${node.arguments
        .map(generateJs)
        .join(", ")})`;

    case "Identifier":
      // Convertir 'self' a 'this' en JavaScript
      if (node.name === "self") {
        return "this";
      }
      return node.name;

    case "Literal":
      return typeof node.value === "string"
        ? `"${node.value}"`
        : String(node.value);

    case "BinaryExpression": {
      let operator = node.operator;

      // Manejar asignación
      if (operator === "=") {
        return `${generateJs(node.left)} = ${generateJs(node.right)}`;
      }

      // Convertir concatenación de PHP (.) a concatenación de JS (+)
      // Solo convertir . a + si parece concatenación de strings (ambos lados son literales string)
      if (
        operator === "." &&
        node.left.type === "Literal" &&
        typeof node.left.value === "string" &&
        node.right.type === "Literal" &&
        typeof node.right.value === "string"
      ) {
        operator = "+";
      }

      // Para acceso a propiedades, no poner espacios
      if (operator === ".") {
        return `${generateJs(node.left)}${operator}${generateJs(node.right)}`;
      }

      return `${generateJs(node.left)} ${operator} ${generateJs(node.right)}`;
    }

    case "UnaryExpression":
      if (node.operator === "not") {
        return `!${generateJs(node.argument)}`;
      }
      return `${node.operator}${generateJs(node.argument)}`;

    case "LambdaExpression":
      return `(${node.params.join(", ")}) => ${generateJs(node.body)}`;

    case "TryStatement": {
      let code = "try {\n";
      code += node.block.map((s) => "  " + generateJs(s)).join("");
      code += "}\n";
      if (node.handler) {
        code += `catch (${node.handler.param.name}) {\n`;
        code += node.handler.body.map((s) => "  " + generateJs(s)).join("");
        code += "}\n";
      }
      if (node.finalizer) {
        code += "finally {\n";
        code += node.finalizer.map((s) => "  " + generateJs(s)).join("");
        code += "}\n";
      }
      return code;
    }

    case "DoWhileStatement":
      return (
        `do {\n` +
        node.body.map((s) => "  " + generateJs(s)).join("") +
        `} while (${generateJs(node.test)});\n`
      );

    case "ArrayExpression": {
      function jsKey(key: Expression) {
        if (
          key.type === "Literal" &&
          typeof key.value === "string" &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key.value)
        ) {
          return key.value; // sin comillas
        }
        return generateJs(key); // con comillas si es string, número, etc.
      }

      // Si hay al menos un ArrayKeyValue, transpila como objeto
      if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
        return (
          "{" +
          node.elements
            .map((el) =>
              el.type === "ArrayKeyValue"
                ? `${jsKey(el.key)}: ${generateJs(el.value)}`
                : generateJs(el)
            )
            .join(", ") +
          "}"
        );
      }
      // Si no, transpila como arreglo normal
      return `[${node.elements.map(generateJs).join(", ")}]`;
    }

    case "MemberExpression": {
      const objectCode = generateJs(node.object);

      // Si no es computed (obj.prop), usar notación de punto
      if (!node.computed) {
        const propertyName =
          node.property.type === "Identifier"
            ? node.property.name
            : generateJs(node.property);
        return `${objectCode}.${propertyName}`;
      }

      // Si es computed (obj[prop]), usar notación de corchetes
      return `${objectCode}[${generateJs(node.property)}]`;
    }

    case "MainMethod":
      // Simplemente genera el cuerpo de statements
      return node.body.map(generateJs).join("");

    case "SwitchStatement": {
      let code = `switch (${generateJs(node.discriminant)}) {\n`;
      node.cases.forEach((c) => {
        if (c.test !== null) {
          code += `  case ${generateJs(c.test)}:\n`;
          code += `    ` + c.consequent.map(generateJs).join("    ");
          code += "    break;\n";
        } else {
          // Caso default
          code += `  default:\n`;
          code += `    ` + c.consequent.map(generateJs).join("    ");
          code += "    break;\n";
        }
      });
      // Si tienes node.defaultCase, agrégalo como default también
      if (node.defaultCase && node.defaultCase.length > 0) {
        code += `  default:\n`;
        code += `    ` + node.defaultCase.map(generateJs).join("    ");
        // code += "    break;\n";
      }
      code += "}\n";
      return code;
    }

    case "ClassDeclaration": {
      let code = `class ${node.name}`;
      if (node.superClass) {
        code += ` extends ${node.superClass.name}`;
      }
      code += " {\n";

      node.body.forEach((member) => {
        if (member.type === "MethodDefinition") {
          const methodName =
            member.kind === "constructor" ? "constructor" : member.key.name;

          // FILTRAR 'self' de los parámetros para JavaScript
          const params = member.value.params
            .filter((param) => param !== "self")
            .join(", ");

          code += `  ${methodName}(${params}) {\n`;
          member.value.body.forEach((stmt) => {
            code += "    " + generateJs(stmt);
          });
          code += "  }\n";
        }
      });

      code += "}\n";
      return code;
    }

    default:
      return "// [NO SOPORTADO]\n";
  }
}

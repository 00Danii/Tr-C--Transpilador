import { Program, Statement, Expression, ArrayKeyValue } from "../ast";

export function generatePhp(
  node: Program | Statement | Expression | ArrayKeyValue | undefined
): string {
  if (!node) return "";
  switch (node.type) {
    case "Program":
      return "<?php\n" + node.body.map(generatePhp).join("") + "?>\n";

    case "FunctionDeclaration":
      return (
        `function ${node.name}(${node.params.join(", ")}) {\n` +
        "  " +
        node.body.map(generatePhp).join("  ") +
        "}\n\n"
      );

    case "ReturnStatement":
      return `return ${generatePhp(node.argument)};\n`;

    case "ExpressionStatement":
      return generatePhp(node.expression) + ";\n";

    case "VariableDeclaration":
      return `$${node.name} = ${generatePhp(node.value)};\n`;

    case "BinaryExpression":
      // convertir + a . para concatenación
      let operator = node.operator;
      if (operator === "+") {
        operator = ".";
      }
      return `${generatePhp(node.left)} ${operator} ${generatePhp(node.right)}`;

    case "Identifier":
      return `$${node.name}`;

    case "Literal":
      if (typeof node.value === "string") {
        return `"${node.value}"`;
      }
      if (typeof node.value === "boolean") {
        return node.value ? "true" : "false";
      }
      return String(node.value);

    case "CallExpression":
      // Si es print (que viene de console.log en JS), genera echo
      if (node.callee.type === "Identifier" && node.callee.name === "print") {
        return "echo " + node.arguments.map(generatePhp).join(", ");
      }
      // Normal
      return `${generatePhp(node.callee)}(${node.arguments
        .map(generatePhp)
        .join(", ")})`;

    case "CommentStatement":
      return `// ${node.value}\n`;

    case "IfStatement":
      let code = `if (${generatePhp(node.test)}) {\n  `;
      code += node.consequent.map(generatePhp).join("  ");
      code += "}\n";
      if (node.alternate) {
        // Detecta else normal representado como IfStatement con test true/1
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          (node.alternate.test.value === true ||
            node.alternate.test.value === 1)
        ) {
          code +=
            "else {\n  " +
            node.alternate.consequent.map(generatePhp).join("  ") +
            "}\n";
        } else if (node.alternate.type === "IfStatement") {
          // else if
          code +=
            "else if (" +
            generatePhp(node.alternate.test) +
            ") {\n  " +
            node.alternate.consequent.map(generatePhp).join("  ") +
            "}\n";
          // Genera el else final si existe y es un IfStatement con test true/1
          if (
            node.alternate.alternate &&
            node.alternate.alternate.type === "IfStatement" &&
            node.alternate.alternate.test.type === "Literal" &&
            (node.alternate.alternate.test.value === true ||
              node.alternate.alternate.test.value === 1)
          ) {
            code +=
              "else {\n  " +
              node.alternate.alternate.consequent.map(generatePhp).join("  ") +
              "}\n";
          }
        } else if (Array.isArray(node.alternate)) {
          code +=
            "else {\n  " + node.alternate.map(generatePhp).join("  ") + "}\n";
        } else {
          code += "else {\n  " + generatePhp(node.alternate) + "}\n\n";
        }
      }
      return code;

    case "WhileStatement":
      return (
        `while (${generatePhp(node.test)}) {\n  ` +
        node.body.map(generatePhp).join("  ") +
        "}\n\n"
      );

    case "ForStatement":
      // Solo ejemplo para for clásico JS
      if (node.init && node.test && node.update) {
        return (
          `for (${generatePhp(node.init).replace(/;\s*$/, "")}; ${generatePhp(
            node.test
          )}; ${generatePhp(node.update).replace(/;\s*$/, "")}) {\n  ` +
          node.body.map(generatePhp).join("  ") +
          "}\n\n"
        );
      }

      // For tipo Python: for i in range(...)
      if (
        node.varName &&
        node.rangeExpr &&
        node.rangeExpr.type === "CallExpression" &&
        node.rangeExpr.callee.type === "Identifier" &&
        node.rangeExpr.callee.name === "range"
      ) {
        const args = node.rangeExpr.arguments.map(generatePhp);
        let start = "0",
          end = "0",
          step = "1";
        if (args.length === 1) {
          // range(end)
          start = "0";
          end = args[0];
        } else if (args.length === 2) {
          // range(start, end)
          start = args[0];
          end = args[1];
        } else if (args.length === 3) {
          // range(start, end, step)
          start = args[0];
          end = args[1];
          step = args[2];
        }
        // Si el paso es negativo, usa i--, si es positivo, i++
        let cmp = step.startsWith("-") ? ">" : "<";
        let inc =
          step === "1" ? `${node.varName}++` : `${node.varName} += ${step}`;
        if (step.startsWith("-")) {
          inc =
            step === "-1" ? `${node.varName}--` : `${node.varName} += ${step}`;
        }
        return (
          `for ($${node.varName} = ${start}; $${node.varName} ${cmp} ${end}; ${inc}) {\n  ` +
          node.body.map(generatePhp).join("  ") +
          "}\n\n"
        );
      }
      return "";

    case "DoWhileStatement":
      return `do {\n  ${node.body
        .map(generatePhp)
        .join("  ")}} while (${generatePhp(node.test)});\n\n`;

    case "UnaryExpression":
      return `${node.operator}${generatePhp(node.argument)}`;

    case "LambdaExpression":
      return `fn($${node.params.join(", ")}) => ${generatePhp(node.body)}`;

    case "TryStatement":
      let tryCode =
        "try {\n  " + node.block.map(generatePhp).join("  ") + "}\n";
      if (node.handler) {
        tryCode +=
          `catch (Exception ${generatePhp(node.handler.param)}) {\n  ` +
          node.handler.body.map(generatePhp).join("  ") +
          "}\n";
      }
      if (node.finalizer) {
        tryCode +=
          "finally {\n  " +
          node.finalizer.map(generatePhp).join("  ") +
          "}\n\n";
      }
      return tryCode;

    case "BlockStatement":
      return node.body.map(generatePhp).join("");

    case "ArrayExpression": {
      // Helper para generar la clave correcta en PHP
      function phpKey(key: any) {
        // Literal: se genera tal cual (generatePhp ya envuelve strings)
        if (key.type === "Literal") return generatePhp(key);
        // Identifier: convertir a string "name" (no $)
        if (key.type === "Identifier") return `"${key.name}"`;
        // Otros (expresiones): generar su código (ej. 0, expresión)
        return generatePhp(key);
      }

      const items = node.elements.map((el: any) => {
        if ((el as any).type === "ArrayKeyValue") {
          return `${phpKey((el as any).key)} => ${generatePhp(
            (el as any).value
          )}`;
        }
        return generatePhp(el as any);
      });
      return "array(" + items.join(", ") + ")";
    }

    case "MemberExpression": {
      const objectCode = generatePhp(node.object);

      // Si el objeto es 'this', convertir a '$this'
      const finalObject = objectCode === "$this" ? "$this" : objectCode;

      // Si no es computed (obj.prop), usar notación de flecha ->
      if (!node.computed) {
        const propertyName =
          node.property.type === "Identifier"
            ? node.property.name
            : generatePhp(node.property);
        return `${finalObject}->${propertyName}`;
      }

      // Si es computed (obj[prop]), usar notación de corchetes
      return `${finalObject}[${generatePhp(node.property)}]`;
    }

    case "MainMethod":
      // Simplemente genera el cuerpo de statements
      return node.body.map(generatePhp).join("");

    case "SwitchStatement": {
      let code = `switch (${generatePhp(node.discriminant)}) {\n`;
      node.cases.forEach((c) => {
        if (c.test !== null) {
          code += `  case ${generatePhp(c.test)}:\n`;
          code += `      ` + c.consequent.map(generatePhp).join("      ");
          code += "      break;\n";
        } else {
          // Caso default
          code += `  default:\n`;
          code += `      ` + c.consequent.map(generatePhp).join("      ");
          code += "      break;\n";
        }
      });
      // Si tienes node.defaultCase, agrégalo como default también
      if (node.defaultCase && node.defaultCase.length > 0) {
        code += `  default:\n`;
        code += `      ` + node.defaultCase.map(generatePhp).join("      ");
        code += "      break;\n";
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
          const visibility = member.visibility || "public";
          const methodName =
            member.key.name === "constructor" ? "__construct" : member.key.name;
          const params = member.value.params.map((p) => `$${p}`).join(", ");
          code += `  ${visibility} function ${methodName}(${params}) {\n`;
          member.value.body.forEach((stmt) => {
            code += "    " + generatePhp(stmt) + "\n";
          });
          code += "  }\n";
        }
      });

      code += "}\n";
      return code;
    }

    default:
      return "";
  }
}

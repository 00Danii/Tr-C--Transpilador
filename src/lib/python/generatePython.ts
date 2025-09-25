import { Program, Statement, Expression } from "../ast";

export function generatePython(node: Program | Statement | Expression): string {
  switch (node?.type) {
    case "Program":
      return node.body.map(generatePython).join("\n");

    case "FunctionDeclaration":
      return `def ${node.name}(${node.params.join(", ")}):\n${node.body
        .map((stmt) => "    " + generatePython(stmt))
        .join("\n")}`;

    case "ReturnStatement":
      return `return ${generatePython(node.argument)}`;

    case "ExpressionStatement":
      return generatePython(node.expression);

    case "BinaryExpression":
      // Soporta asignaciones y operaciones
      return `${generatePython(node.left)} ${node.operator} ${generatePython(
        node.right
      )}`;

    case "Identifier":
      return node.name;

    case "Literal":
      if (typeof node.value === "string") {
        // Elimina comillas extra si existen
        const val = node.value.replace(/^"+|"+$/g, "");
        return `"${val}"`;
      }
      return String(node.value);

    case "VariableDeclaration":
      return `${node.name} = ${generatePython(node.value)}`;

    case "CallExpression":
      return `${generatePython(node.callee)}(${node.arguments
        .map(generatePython)
        .join(", ")})`;

    case "CommentStatement":
      return `# ${node.value}`;

    case "IfStatement": {
      // Helper para alternates anidados
      function handleAlternate(alt: any): string {
        if (alt.type === "IfStatement" && alt.test.type !== "Literal") {
          // elif
          let code = `elif ${generatePython(alt.test)}:\n`;
          code += alt.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          if (alt.alternate) {
            code += handleAlternate(alt.alternate);
          }
          return "\n" + code;
        } else if (alt.type === "IfStatement" && alt.test.type === "Literal") {
          // else
          let code = `else:\n`;
          code += alt.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return "\n" + code;
        } else if (Array.isArray(alt)) {
          // else como array de statements
          let code = `else:\n`;
          code += alt
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return "\n" + code;
        } else {
          // else como statement único
          return `\nelse:\n    ${generatePython(alt)}`;
        }
      }

      let code = `if ${generatePython(node.test)}:\n`;
      code += node.consequent
        .map((s: Statement) => "    " + generatePython(s))
        .join("\n");
      if (node.alternate) {
        code += handleAlternate(node.alternate);
      }
      return code;
    }

    case "WhileStatement":
      return `while ${generatePython(node.test)}:\n${node.body
        .map((s: Statement) => "    " + generatePython(s))
        .join("\n")}`;

    case "ForStatement": {
      // Soporta for clásico:
      //   for (let i = 0; i < N; i++)
      // y for (i = 0; i < N; i++)
      let varName: string | undefined;
      let start: string | undefined;

      if (node.init && node.init.type === "VariableDeclaration") {
        varName = node.init.name;
        start = generatePython(node.init.value);
      } else if (
        node.init &&
        node.init.type === "ExpressionStatement" &&
        node.init.expression.type === "BinaryExpression" &&
        node.init.expression.operator === "=" &&
        node.init.expression.left.type === "Identifier"
      ) {
        varName = node.init.expression.left.name;
        start = generatePython(node.init.expression.right);
      }

      if (
        varName &&
        start !== undefined &&
        node.test &&
        node.test.type === "BinaryExpression" &&
        node.test.operator === "<" &&
        node.test.left.type === "Identifier" &&
        node.test.left.name === varName &&
        node.update &&
        node.update.type === "ExpressionStatement" &&
        node.update.expression.type === "BinaryExpression" &&
        node.update.expression.operator === "=" &&
        node.update.expression.left.type === "Identifier" &&
        node.update.expression.left.name === varName &&
        node.update.expression.right.type === "BinaryExpression" &&
        node.update.expression.right.operator === "+" &&
        node.update.expression.right.left.type === "Identifier" &&
        node.update.expression.right.left.name === varName &&
        node.update.expression.right.right.type === "Literal" &&
        node.update.expression.right.right.value === 1
      ) {
        const end = generatePython(node.test.right);
        let code = `for ${varName} in range(${start}, ${end}):\n`;
        code += node.body
          .map((s: Statement) => "    " + generatePython(s))
          .join("\n");
        return code;
      }
      // Otros tipos de for no soportados
      return "# [NO SOPORTADO: for]";
    }

    case "DoWhileStatement": {
      // Simula do...while usando while True y break
      let code = "while True:\n";
      code += node.body
        .map((s: Statement) => "    " + generatePython(s))
        .join("\n");
      code += `\n    if not (${generatePython(node.test)}):\n        break`;
      return code;
    }

    default:
      return "# [NO SOPORTADO]";
  }
}

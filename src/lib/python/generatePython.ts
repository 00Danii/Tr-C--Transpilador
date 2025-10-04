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
      if (typeof node.value === "boolean") {
        return node.value ? "True" : "False";
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
      // Soporte para for clásico con incremento personalizado
      let varName: string | undefined;
      let start: string | undefined;
      let end: string | undefined;
      let step: string | undefined;

      // Detecta for (i = start; i < end; i += step)
      if (
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
        node.test &&
        node.test.type === "BinaryExpression" &&
        node.test.operator === "<" &&
        node.test.left.type === "Identifier" &&
        node.test.left.name === varName
      ) {
        end = generatePython(node.test.right);
      }

      if (
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
        node.update.expression.right.right.type === "Literal"
      ) {
        step = generatePython(node.update.expression.right.right);
      } else if (
        node.update &&
        node.update.type === "ExpressionStatement" &&
        node.update.expression.type === "BinaryExpression" &&
        node.update.expression.operator === "+=" &&
        node.update.expression.left.type === "Identifier" &&
        node.update.expression.left.name === varName &&
        node.update.expression.right.type === "Literal"
      ) {
        step = generatePython(node.update.expression.right);
      }

      if (
        varName &&
        start !== undefined &&
        end !== undefined &&
        step !== undefined
      ) {
        if (step === "1") {
          // No mostrar el paso si es 1
          let code = `for ${varName} in range(${start}, ${end}):\n`;
          code += node.body
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return code;
        } else {
          // Mostrar el paso si es distinto de 1
          let code = `for ${varName} in range(${start}, ${end}, ${step}):\n`;
          code += node.body
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return code;
        }
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

    case "LambdaExpression":
      return `lambda ${node.params.join(", ")}: ${generatePython(node.body)}`;

    case "TryStatement": {
      let code = "try:\n";
      code += node.block.map((s) => "    " + generatePython(s)).join("\n");
      if (node.handler) {
        code += `\nexcept Exception as ${node.handler.param.name}:\n`;
        code += node.handler.body
          .map((s) => "    " + generatePython(s))
          .join("\n");
      }
      if (node.finalizer) {
        code += `\nfinally:\n`;
        code += node.finalizer
          .map((s) => "    " + generatePython(s))
          .join("\n");
      }
      return code;
    }

    case "ArrayExpression":
      return `[${node.elements.map(generatePython).join(", ")}]`;

    case "MemberExpression":
      return `${generatePython(node.object)}[${generatePython(node.property)}]`;

    default:
      return "# [NO SOPORTADO]";
  }
}

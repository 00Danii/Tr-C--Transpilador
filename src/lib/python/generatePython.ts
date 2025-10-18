import { Program, Statement, Expression, ArrayKeyValue } from "../ast";

export function generatePython(
  node: Program | Statement | Expression | ArrayKeyValue | undefined
): string {
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

    case "BinaryExpression": {
      if (node.operator === "=") {
        return `${generatePython(node.left)} = ${generatePython(node.right)}`;
      }
      // Otros operadores
      return `${generatePython(node.left)} ${node.operator} ${generatePython(
        node.right
      )}`;
    }

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
      // Soporte para for de PSeInt/Python
      if (node.varName && node.rangeExpr && node.body) {
        let code = `for ${node.varName} in ${generatePython(
          node.rangeExpr
        )}:\n`;
        code += node.body
          .map((s: Statement) => "    " + generatePython(s))
          .join("\n");
        return code;
      }

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
      if (node.until) {
        code += `\n    if ${generatePython(node.test)}:\n        break`;
      } else {
        code += `\n    if not (${generatePython(node.test)}):\n        break`;
      }
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

    case "ArrayExpression": {
      // Si hay al menos un ArrayKeyValue, transpila como dict
      if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
        return (
          "{" +
          node.elements
            .map((el) =>
              el.type === "ArrayKeyValue"
                ? `"${generatePython(el.key)}": ${generatePython(el.value)}`
                : generatePython(el)
            )
            .join(", ") +
          "}"
        );
      }
      // Si no, transpila como lista
      return "[" + node.elements.map(generatePython).join(", ") + "]";
    }

    case "MemberExpression": {
      const objectCode = generatePython(node.object);

      // Si el objeto es 'this', convertir a 'self'
      const finalObject = objectCode === "this" ? "self" : objectCode;

      // Si no es computed (obj.prop), usar notación de punto
      if (!node.computed) {
        return `${finalObject}.${generatePython(node.property)}`;
      }

      // Si es computed (obj[prop]), usar notación de corchetes
      return `${finalObject}[${generatePython(node.property)}]`;
    }

    case "MainMethod":
      // Simplemente genera el cuerpo de statements
      return node.body.map(generatePython).join("\n");

    case "SwitchStatement": {
      let code = "";
      const discrim = generatePython(node.discriminant);
      node.cases.forEach((c, idx) => {
        if (c.test !== null) {
          const cond = `${discrim} == ${generatePython(c.test)}`;
          code += idx === 0 ? `if ${cond}:\n` : `\nelif ${cond}:\n`;
          code += c.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
        } else {
          // Caso default
          code += `else:\n`;
          code += c.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
        }
      });
      // Si tienes node.defaultCase, puedes agregarlo aquí también
      if (node.defaultCase && node.defaultCase.length > 0) {
        code += `\nelse:\n`;
        code += node.defaultCase
          .map((s: Statement) => "    " + generatePython(s))
          .join("\n");
      }
      return code;
    }

    case "LogicalExpression": {
      if (node.operator === "!") {
        return `not (${generatePython(node.left)})`;
      }
      if (node.operator === "&&") {
        return `${generatePython(node.left)} and ${generatePython(node.right)}`;
      }
      if (node.operator === "||") {
        return `${generatePython(node.left)} or ${generatePython(node.right)}`;
      }
      // Otros operadores lógicos
      return `${generatePython(node.left)} ${node.operator} ${generatePython(
        node.right
      )}`;
    }

    case "ArrayDeclaration": {
      const dims = node.dimensions.map(generatePython);
      if (dims.length === 1) {
        return `${node.name} = [None] * ${dims[0]}`;
      } else if (dims.length === 2) {
        return `${node.name} = [[None] * ${dims[1]} for _ in range(${dims[0]})]`;
      } else {
        return `${node.name} = []  # [NO SOPORTADO: arreglos de más de 2 dimensiones]`;
      }
    }

    case "ClassDeclaration": {
      let code = `class ${node.name}`;
      if (node.superClass) {
        code += `(${node.superClass.name})`;
      }
      code += ":\n";

      node.body.forEach((member) => {
        if (member.type === "MethodDefinition") {
          const methodName =
            member.key.name === "constructor" ? "__init__" : member.key.name;
          const params = member.value.params.join(", ");
          code += `    def ${methodName}(self${
            params ? ", " + params : ""
          }):\n`;
          member.value.body.forEach((stmt) => {
            code += "        " + generatePython(stmt) + "\n";
          });
        }
      });

      return code;
    }

    // case "MethodDefinition":
    //   // Manejado en ClassDeclaration
    //   return "";

    default:
      return "# [NO SOPORTADO]";
  }
}

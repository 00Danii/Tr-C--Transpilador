import { Program, Statement, Expression } from "../ast";

function isDefinition(node: Statement | Expression) {
  return node?.type === "FunctionDeclaration";
}

function isExecutable(node: Statement | Expression) {
  // Todo lo que no sea definición
  return !isDefinition(node);
}

export function generateJava(node: Program | Statement | Expression): string {
  if (node?.type === "Program") {
    // Separa definiciones y ejecutables
    const definitions = node.body.filter(isDefinition);
    const executables = node.body.filter(isExecutable);

    // Métodos fuera de main
    const methods = definitions.map(generateJava).join("\n\n");

    // Código ejecutable dentro de main
    const mainBody = executables.map(generateJava).join("\n");

    return (
      "public class Main {\n" +
      (methods ? methods + "\n\n" : "") +
      "  public static void main(String[] args) {\n" +
      mainBody
        .split("\n")
        .map((line) => (line ? "    " + line : ""))
        .join("\n") +
      "\n  }\n}"
    );
  }

  switch (node?.type) {
    case "FunctionDeclaration":
      // Por simplicidad, todos los métodos son public static void y parámetros tipo int
      return `  public static void ${node.name}(${node.params
        .map((p) => `int ${p}`)
        .join(", ")}) {\n${node.body
        .map((stmt) => "    " + generateJava(stmt).replace(/\n/g, ""))
        .join("\n")}\n  }`;

    case "ReturnStatement":
      return `return ${generateJava(node.argument)};`;

    case "VariableDeclaration":
      // Por simplicidad, todo es int
      return `int ${node.name} = ${generateJava(node.value)};`;

    case "ExpressionStatement":
      return `${generateJava(node.expression)};`;

    case "IfStatement": {
      let code = `if (${generateJava(node.test)}) {\n`;
      code += node.consequent.map((s) => "  " + generateJava(s)).join("");
      code += "}\n";
      if (node.alternate) {
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          node.alternate.test.value === true
        ) {
          // else
          code += `else {\n${node.alternate.consequent
            .map((s) => "  " + generateJava(s))
            .join("")}}\n`;
        } else if (node.alternate.type === "IfStatement") {
          // else if
          code += `else ${generateJava(node.alternate)}`;
        } else {
          if (Array.isArray(node.alternate)) {
            code += `else {\n${node.alternate
              .map((s) => "  " + generateJava(s))
              .join("")}}\n`;
          } else {
            code += `else {\n  ${generateJava(node.alternate)}\n}\n`;
          }
        }
      }
      return code;
    }

    case "WhileStatement":
      return `while (${generateJava(node.test)}) {\n${node.body
        .map((s) => "  " + generateJava(s))
        .join("")}}\n`;

    case "ForStatement": {
      if (node.init && node.test && node.update) {
        return (
          `for (${generateJava(node.init).replace(/;\s*$/, "")}; ${generateJava(
            node.test
          )}; ${generateJava(node.update).replace(/;\s*$/, "")}) {\n` +
          node.body.map((s) => "  " + generateJava(s)).join("") +
          "}\n"
        );
      }
      return "// [NO SOPORTADO: for]\n";
    }

    case "DoWhileStatement":
      return (
        `do {\n` +
        node.body.map((s) => "  " + generateJava(s)).join("") +
        `} while (${generateJava(node.test)});\n`
      );

    case "CommentStatement":
      return `// ${node.value}`;

    case "CallExpression":
      // print → System.out.println
      if (node.callee.type === "Identifier" && node.callee.name === "print") {
        return `System.out.println(${node.arguments
          .map(generateJava)
          .join(", ")})`;
      }
      return `${generateJava(node.callee)}(${node.arguments
        .map(generateJava)
        .join(", ")})`;

    case "Identifier":
      return node.name;

    case "Literal":
      if (typeof node.value === "string") return `"${node.value}"`;
      if (typeof node.value === "boolean") return node.value ? "true" : "false";
      if (node.value === null) return "null";
      return String(node.value);

    case "BinaryExpression":
      return `${generateJava(node.left)} ${node.operator} ${generateJava(
        node.right
      )}`;

    case "UnaryExpression":
      if (node.operator === "not") {
        return `!${generateJava(node.argument)}`;
      }
      return `${node.operator}${generateJava(node.argument)}`;

    case "LambdaExpression":
      // Java lambdas requieren contexto, aquí solo como ejemplo:
      return `(${node.params.join(", ")}) -> ${generateJava(node.body)}`;

    case "TryStatement": {
      let code = "try {\n";
      code += node.block.map((s) => "  " + generateJava(s)).join("");
      code += "}\n";
      if (node.handler) {
        code += `catch (Exception ${node.handler.param.name}) {\n`;
        code += node.handler.body.map((s) => "  " + generateJava(s)).join("");
        code += "}\n";
      }
      if (node.finalizer) {
        code += "finally {\n";
        code += node.finalizer.map((s) => "  " + generateJava(s)).join("");
        code += "}\n";
      }
      return code;
    }

    case "BlockStatement":
      return node.body.map(generateJava).join("\n");

    default:
      return "// [NO SOPORTADO]\n";
  }
}

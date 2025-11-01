import { Program, Statement, Expression } from "../ast";

function isDefinition(node: Statement | Expression) {
  return node?.type === "FunctionDeclaration";
}

function isExecutable(node: Statement | Expression) {
  // Todo lo que no sea definición
  return !isDefinition(node);
}

// Inferir tipo de datos para variables y expresiones
function inferType(node: Expression, typeMap: Map<string, string>): string {
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") {
        // Devuelve el TIPO de dato (char o String)
        return node.value.length === 1 ? "char" : "String";
      }
      if (typeof node.value === "number") {
        // Si tiene parte decimal, double; sino int
        return node.value % 1 === 0 ? "int" : "double";
      }
      if (typeof node.value === "boolean") return "boolean";
      return "Object";

    case "BinaryExpression":
      const leftType = inferType(node.left, typeMap);
      const rightType = inferType(node.right, typeMap);
      // Concatenación: si incluye String o char, resultado es String
      if (
        node.operator === "+" &&
        (leftType === "String" ||
          rightType === "String" ||
          leftType === "char" ||
          rightType === "char")
      ) {
        return "String";
      }
      // Operaciones aritméticas: si cualquiera es double, resultado es double
      if (leftType === "double" || rightType === "double") {
        return "double";
      }
      return leftType === "int" && rightType === "int" ? "int" : "Object";

    case "Identifier":
      return typeMap.get(node.name) || "Object";

    case "CallExpression":
      // Funciones conocidas
      if (node.callee.type === "Identifier") {
        if (node.callee.name === "print") return "void";
        // Aquí podrías agregar más funciones conocidas
      }
      return "Object";

    case "ArrayExpression":
      // Si contiene ArrayKeyValue, es un objeto literal → Map
      if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
        return "Map<String, Object>";
      }
      // Sino, es un arreglo normal
      if (node.elements.length === 0) return "Object[]";
      const elementTypes = node.elements.map((el) => inferType(el, typeMap));
      const uniqueTypes = [...new Set(elementTypes)];
      // Si todos los elementos son del mismo tipo, usa ese tipo; sino Object[]
      if (uniqueTypes.length === 1) {
        return `${uniqueTypes[0]}[]`;
      }
      return "Object[]";

    default:
      return "Object";
  }
}

// Función helper para recolectar tipos en todo el AST
function collectTypes(
  node: Statement | Expression,
  typeMap: Map<string, string>
) {
  if (node?.type === "VariableDeclaration") {
    const inferredType = inferType(node.value, typeMap);
    typeMap.set(node.name, inferredType);
  }
  // REMOVIDO:
  // Para que identifique por primera aparición
  // en el flujo de generación (no en el AST completo)
  // if (
  //   node?.type === "ExpressionStatement" &&
  //   node.expression.type === "BinaryExpression" &&
  //   node.expression.operator === "=" &&
  //   node.expression.left.type === "Identifier"
  // ) {
  //   const varName = node.expression.left.name;
  //   const inferredType = inferType(node.expression.right, typeMap);
  //   typeMap.set(varName, inferredType);
  // }
  if (node?.type === "IfStatement") {
    collectTypes(node.test, typeMap);
    node.consequent.forEach((s) => collectTypes(s, typeMap));
    if (node.alternate) {
      if (Array.isArray(node.alternate)) {
        node.alternate.forEach((s) => collectTypes(s, typeMap));
      } else {
        collectTypes(node.alternate, typeMap);
      }
    }
  }
  if (node?.type === "WhileStatement") {
    collectTypes(node.test, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "ForStatement") {
    if (node.init) collectTypes(node.init, typeMap);
    if (node.test) collectTypes(node.test, typeMap);
    if (node.update) collectTypes(node.update, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "DoWhileStatement") {
    collectTypes(node.test, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "TryStatement") {
    node.block.forEach((s) => collectTypes(s, typeMap));
    if (node.handler)
      node.handler.body.forEach((s) => collectTypes(s, typeMap));
    if (node.finalizer) node.finalizer.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "FunctionDeclaration") {
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "SwitchStatement") {
    collectTypes(node.discriminant, typeMap);
    node.cases.forEach((switchCase) => {
      if (switchCase.test) collectTypes(switchCase.test, typeMap);
      switchCase.consequent.forEach((s) => collectTypes(s, typeMap));
    });
    if (node.defaultCase)
      node.defaultCase.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "ArrayDeclaration") {
    if (node.initialValue) collectTypes(node.initialValue, typeMap);
    node.dimensions.forEach((dim) => collectTypes(dim, typeMap));
  }
  if (node?.type === "MemberExpression") {
    collectTypes(node.object, typeMap);
    collectTypes(node.property, typeMap);
  }
  if (node?.type === "ArrayExpression") {
    // Para objetos, recolectar tipos de valores
    if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
      node.elements.forEach((el) => {
        if (el.type === "ArrayKeyValue") collectTypes(el.value, typeMap);
      });
    } else {
      // Para arreglos normales
      node.elements.forEach((el) => collectTypes(el, typeMap));
    }
  }

  // Agrega más casos ...
}

// Función helper para detectar objetos literales
function hasObjectLiterals(node: Program | Statement | Expression): boolean {
  if (node?.type === "ArrayExpression") {
    return node.elements.some((el) => el.type === "ArrayKeyValue");
  }
  if (node?.type === "Program") {
    return node.body.some(hasObjectLiterals);
  }
  if (node?.type === "VariableDeclaration") {
    return hasObjectLiterals(node.value);
  }
  // Agrega más casos si es necesario
  return false;
}

export function generateJava(node: Program | Statement | Expression): string {
  const typeMap = new Map<string, string>();

  // Primera pasada: recolectar tipos recursivamente en todo el programa
  if (node?.type === "Program") {
    node.body.forEach((stmt) => collectTypes(stmt, typeMap));
  }

  // Función interna recursiva que usa el typeMap
  function generateWithTypes(node: Program | Statement | Expression): string {
    if (node?.type === "Program") {
      // Verificar si hay objetos literales en el AST
      const hasObjects = hasObjectLiterals(node);

      // Separa definiciones y ejecutables
      const definitions = node.body.filter(isDefinition);
      const executables = node.body.filter(isExecutable);

      // Métodos fuera de main
      const methods = definitions.map(generateWithTypes).join("\n\n");

      // Código ejecutable dentro de main
      const mainBody = executables.map(generateWithTypes).join("\n");

      // Importaciones si hay objetos
      const imports = hasObjects
        ? "import java.util.Map;\nimport java.util.HashMap;\n\n"
        : "";

      return (
        imports +
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
          .map((p) => `${typeMap.get(p) || "Object"} ${p}`)
          .join(", ")}) {\n${node.body
          .map((stmt) => "    " + generateWithTypes(stmt).replace(/\n/g, ""))
          .join("\n")}\n  }`;

      case "ReturnStatement":
        return `return ${generateWithTypes(node.argument)};`;

      case "VariableDeclaration":
        const varType = typeMap.get(node.name) || "Object";
        if (varType === "Map<String, Object>") {
          // Generar código especial para objetos literales
          const mapLines: string[] = [];
          if (node.value.type === "ArrayExpression") {
            node.value.elements.forEach((el) => {
              if (el.type === "ArrayKeyValue") {
                // Claves: si es Identifier, agregar comillas; si es Literal, usar generateWithTypes
                const key =
                  el.key.type === "Identifier"
                    ? `"${el.key.name}"`
                    : generateWithTypes(el.key);
                const value = generateWithTypes(el.value);
                mapLines.push(`${node.name}.put(${key}, ${value});`);
              }
            });
          }
          return `// Crear un mapa (clave-valor)\n${varType} ${
            node.name
          } = new HashMap<>();\n// Asignar claves y valores\n${mapLines.join(
            "\n"
          )}`;
        }
        return `${varType} ${node.name} = ${generateWithTypes(node.value)};`;

      case "ExpressionStatement":
        // Si es asignación
        if (
          node.expression.type === "BinaryExpression" &&
          node.expression.operator === "="
        ) {
          const left = node.expression.left;
          if (left.type === "Identifier") {
            const varName = left.name;
            const varType = typeMap.get(varName);
            const rightCode = generateWithTypes(node.expression.right);
            if (varType) {
              // Ya declarada, solo asignar
              return `${varName} = ${rightCode};`;
            } else {
              // No declarada, declarar con tipo inferido
              const inferredType = inferType(node.expression.right, typeMap);
              typeMap.set(varName, inferredType);
              if (inferredType === "Map<String, Object>") {
                // Generar código especial para objetos literales
                const mapLines: string[] = [];
                if (node.expression.right.type === "ArrayExpression") {
                  node.expression.right.elements.forEach((el) => {
                    if (el.type === "ArrayKeyValue") {
                      // Claves: si es Identifier, agregar comillas; si es Literal, usar generateWithTypes
                      const key =
                        el.key.type === "Identifier"
                          ? `"${el.key.name}"`
                          : generateWithTypes(el.key);
                      const value = generateWithTypes(el.value);
                      mapLines.push(`${varName}.put(${key}, ${value});`);
                    }
                  });
                }
                return `// Crear un mapa (clave-valor)\n${inferredType} ${varName} = new HashMap<>();\n// Asignar claves y valores\n${mapLines.join(
                  "\n"
                )}`;
              } else {
                return `${inferredType} ${varName} = ${rightCode};`;
              }
            }
          }
        }
        return `${generateWithTypes(node.expression)};`;

      case "IfStatement": {
        let code = `if (${generateWithTypes(node.test)}) {\n`;
        code += node.consequent
          .map((s) => "  " + generateWithTypes(s))
          .join("");
        code += "\n}\n";
        if (node.alternate) {
          if (
            node.alternate.type === "IfStatement" &&
            node.alternate.test.type === "Literal" &&
            Boolean(node.alternate.test.value)
          ) {
            // else
            code += `else {\n${node.alternate.consequent
              .map((s) => "  " + generateWithTypes(s))
              .join("")}\n}\n`;
          } else if (node.alternate.type === "IfStatement") {
            // else if
            code += `else ${generateWithTypes(node.alternate)}`;
          } else {
            if (Array.isArray(node.alternate)) {
              code += `else {\n${node.alternate
                .map((s) => "  " + generateWithTypes(s))
                .join("")}\n}\n`;
            } else {
              code += `else {\n  ${generateWithTypes(node.alternate)}\n}\n`;
            }
          }
        }
        return code;
      }

      case "WhileStatement":
        return `while (${generateWithTypes(node.test)}) {\n${node.body
          .map((s) => "  " + generateWithTypes(s))
          .join("\n")}\n}\n`;

      case "ForStatement": {
        if (node.init && node.test && node.update) {
          return (
            `for (${generateWithTypes(node.init).replace(
              /;\s*$/,
              ""
            )}; ${generateWithTypes(node.test)}; ${generateWithTypes(
              node.update
            ).replace(/;\s*$/, "")}) {\n` +
            node.body.map((s) => "  " + generateWithTypes(s)).join("\n") +
            "\n}\n"
          );
        }
        return "// [NO SOPORTADO: for]\n";
      }

      case "DoWhileStatement":
        return (
          `do {\n` +
          node.body.map((s) => "  " + generateWithTypes(s)).join("\n") +
          `\n} while (${generateWithTypes(node.test)});\n`
        );

      case "CommentStatement":
        return `// ${node.value}`;

      case "CallExpression":
        // console.log → System.out.println
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "console" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "log"
        ) {
          return `System.out.println(${node.arguments
            .map(generateWithTypes)
            .join(", ")})`;
        }
        // print → System.out.println
        if (node.callee.type === "Identifier" && node.callee.name === "print") {
          return `System.out.println(${node.arguments
            .map(generateWithTypes)
            .join(", ")})`;
        }
        return `${generateWithTypes(node.callee)}(${node.arguments
          .map(generateWithTypes)
          .join(", ")})`;

      case "Identifier":
        return node.name;

      case "Literal":
        if (typeof node.value === "string") {
          // Char usa comillas simples, String dobles
          return node.value.length === 1
            ? `'${node.value}'`
            : `"${node.value}"`;
        }
        if (typeof node.value === "boolean")
          return node.value ? "true" : "false";
        if (node.value === null) return "null";
        return String(node.value);

      case "BinaryExpression":
        return `${generateWithTypes(node.left)} ${
          node.operator
        } ${generateWithTypes(node.right)}`;

      case "UnaryExpression":
        return `${node.operator}${generateWithTypes(node.argument)}`;

      case "LambdaExpression":
        // Java lambdas requieren contexto, aquí solo como ejemplo:
        return `(${node.params.join(", ")}) -> ${generateWithTypes(node.body)}`;

      case "TryStatement": {
        let code = "try {\n";
        code += node.block.map((s) => "  " + generateWithTypes(s)).join("\n");
        code += "\n}\n";
        if (node.handler) {
          code += `catch (Exception ${node.handler.param.name}) {\n`;
          code += node.handler.body
            .map((s) => "  " + generateWithTypes(s))
            .join("\n");
          code += "\n}\n";
        }
        if (node.finalizer) {
          code += "finally {\n";
          code += node.finalizer
            .map((s) => "  " + generateWithTypes(s))
            .join("\n");
          code += "\n}\n";
        }
        return code;
      }

      case "BlockStatement":
        return node.body.map(generateWithTypes).join("\n");

      case "SwitchStatement": {
        let code = `switch (${generateWithTypes(node.discriminant)}) {\n`;
        node.cases.forEach((switchCase) => {
          if (switchCase.test === null) {
            code += `  default:\n`;
          } else {
            code += `  case ${generateWithTypes(switchCase.test)}:\n`;
          }
          switchCase.consequent.forEach((stmt) => {
            code += `    ${generateWithTypes(stmt)}\n`;
          });
          // Agregar break automáticamente para cada caso (común en Java)
          code += `    break;\n`;
        });
        // Manejar defaultCase si existe (por si no está en cases)
        if (node.defaultCase) {
          code += `  default:\n`;
          node.defaultCase.forEach((stmt) => {
            code += `    ${generateWithTypes(stmt)}\n`;
          });
          code += `    break;\n`;
        }
        code += `}\n`;
        return code;
      }

      case "ArrayExpression":
        const arrayType = inferType(node, typeMap);
        const elementType = arrayType.replace("[]", "");
        const elements = node.elements.map(generateWithTypes).join(", ");
        return `new ${elementType}[]{${elements}}`;

      case "ArrayDeclaration":
        const declType = inferType(
          node.initialValue || { type: "ArrayExpression", elements: [] },
          typeMap
        );
        const baseType = declType.replace(/\[\]/g, "");
        const dimensions = node.dimensions.map(generateWithTypes).join("][");
        const init = node.initialValue
          ? ` = ${generateWithTypes(node.initialValue)}`
          : "";
        return `${baseType}[][${dimensions}] ${node.name}${init};`;

      case "MemberExpression":
        const objType = inferType(node.object, typeMap);
        if (node.computed && objType === "Map<String, Object>") {
          // Acceso a Map: map.get(key)
          return `${generateWithTypes(node.object)}.get(${generateWithTypes(
            node.property
          )})`;
        } else if (node.computed) {
          // Acceso a arreglo: arr[index]
          return `${generateWithTypes(node.object)}[${generateWithTypes(
            node.property
          )}]`;
        } else {
          // Acceso a propiedad: obj.prop
          return `${generateWithTypes(node.object)}.${generateWithTypes(
            node.property
          )}`;
        }

      default:
        return "// [NO SOPORTADO]\n";
    }
  }

  return generateWithTypes(node);
}

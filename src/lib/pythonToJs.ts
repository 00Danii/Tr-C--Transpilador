export function pythonToJs(code: string): string {
  let jsCode = code;

  // Comentarios
  jsCode = jsCode.replace(/^#(.*)/gm, "//$1");

  // Funciones
  jsCode = jsCode.replace(
    /def\s+(\w+)\s*\(([^)]*)\):/g,
    (match, name, args) => `function ${name}(${args.replace(/,\s*/g, ", ")}) {`
  );

  // print → console.log
  jsCode = jsCode.replace(/print\((.*?)\)/g, "console.log($1)");

  // Variables (muy básico: detectar asignación simple al inicio de línea)
  jsCode = jsCode.replace(/^(\w+)\s*=\s*(.*)$/gm, "let $1 = $2;");

  // Operadores
  jsCode = jsCode.replace(/==/g, "===");
  jsCode = jsCode.replace(/!=/g, "!==");

  // if / elif / else
  jsCode = jsCode.replace(/elif\s+(.*):/g, "else if ($1) {");
  jsCode = jsCode.replace(/if\s+(.*):/g, "if ($1) {");
  jsCode = jsCode.replace(/else:/g, "else {");

  // while
  jsCode = jsCode.replace(/while\s+(.*):/g, "while ($1) {");

  // for (solo range simple)
  jsCode = jsCode.replace(
    /for\s+(\w+)\s+in\s+range\((\d+),\s*(\d+)\):/g,
    "for (let $1 = $2; $1 < $3; $1++) {"
  );

  // Cierre de bloques (indentación → })
  const lines = jsCode.split("\n");
  let resultLines: string[] = [];
  let indentStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.match(/^\s*/)?.[0].length || 0;
    const trimmed = line.trim();

    // Cerrar llaves cuando la indentación baja
    while (
      indentStack.length > 0 &&
      indent < indentStack[indentStack.length - 1]
    ) {
      resultLines.push("}".padStart(indentStack.pop()! + 1, " "));
    }

    resultLines.push(line);

    // Si termina en "{" (if, else, while, for, function)
    if (/\{\s*$/.test(trimmed)) {
      indentStack.push(indent + 2); // asumir indentación de 2 espacios
    }
  }

  // Cerrar bloques que queden abiertos
  while (indentStack.length > 0) {
    resultLines.push("}".padStart(indentStack.pop()! + 1, " "));
  }

  jsCode = resultLines.join("\n");

  return jsCode.trim();
}

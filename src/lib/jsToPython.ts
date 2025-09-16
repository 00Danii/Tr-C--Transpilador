export function jsToPython(code: string): string {
  let pyCode = code;

  // 1. Eliminar comentarios de línea (// → #)
  pyCode = pyCode.replace(/\/\/(.*)/g, "# $1");

  // 2. Eliminar comentarios de bloque (/* ... */ → # ...)
  pyCode = pyCode.replace(/\/\*([\s\S]*?)\*\//g, (match, p1) =>
    p1.split("\n").map((line: string) => `# ${line.trim()}`).join("\n")
  );

  // 3. Convertir declaración de función
  pyCode = pyCode.replace(
    /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, args) => `def ${name}(${args.replace(/,/g, ", ")}):`
  );

  // 4. console.log → print
  pyCode = pyCode.replace(/console\.log\((.*?)\);?/g, "print($1)");

  // 5. Variables: let/const/var → asignación simple
  pyCode = pyCode.replace(/\b(let|const|var)\s+(\w+)\s*=\s*(.*?);/g, "$2 = $3");

  // 6. if (...) { → if ...:
  pyCode = pyCode.replace(/if\s*\((.*?)\)\s*\{/g, "if $1:");

  // 7. else if (...) { → elif ...:
  pyCode = pyCode.replace(/else if\s*\((.*?)\)\s*\{/g, "elif $1:");

  // 8. else { → else:
  pyCode = pyCode.replace(/else\s*\{/g, "else:");

  // 9. while (...) { → while ...:
  pyCode = pyCode.replace(/while\s*\((.*?)\)\s*\{/g, "while $1:");

  // 10. for (let i = 0; i < n; i++) { → for i in range(0, n):
  pyCode = pyCode.replace(
    /for\s*\(\s*let\s+(\w+)\s*=\s*(\d+);\s*\1\s*<\s*(\w+);\s*\1\+\+\s*\)\s*\{/g,
    "for $1 in range($2, $3):"
  );

  // 11. Eliminar llaves de cierre
  pyCode = pyCode.replace(/\}/g, "");

  // 12. Eliminar punto y coma
  pyCode = pyCode.replace(/;/g, "");

  // 13. Indentación automática (muy simplificada)
  // Indenta después de ":" hasta encontrar una línea sin indentación
  const lines = pyCode.split("\n");
  let indentLevel = 0;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.match(/^(else:|elif|else if)/)) {
      // else/elif deben mantener indentación del bloque anterior
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    if (line.endsWith(":")) {
      lines[i] = "    ".repeat(indentLevel) + line;
      indentLevel++;
    } else {
      lines[i] = "    ".repeat(indentLevel) + line;
    }

    if (line === "") continue;
    if (line.startsWith("#")) continue;
  }
  pyCode = lines.join("\n");

  // 14. Limpiar prints vacíos redundantes
  pyCode = pyCode.replace(/print\(\s*\)/g, "print()");

  return pyCode.trim();
}

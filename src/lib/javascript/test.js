// Comentario de línea
/* Comentario de bloque */

// DECLARACION DE FUNCION
function suma(a, b) {
  let resultado = a + b;
  return resultado;
}

// FUNCION FLECHA
const multiplicar = (x, y) => x * y;

// IF ELSE IF ELSE
let contador = 0;
if (contador === 0) {
  console.log("Contador en cero");
} else if (contador > 0) {
  console.log("Contador positivo");
} else {
  console.log("Contador negativo");
}

// WHILE
while (contador < 3) {
  console.log(contador);
  contador++;
}

// DO WHILE
do {
  contador--;
  console.log("do while:", contador);
} while (contador > 0);


// FOR
for (i = 0; i < 5; i++) {
  console.log("i =", i);
}

// TRY CATCH FINALLY
try {
  let x = 10 / 0;
} catch (e) {
  console.log("Capturado:", e);
} finally {
  console.log("Bloque finally");
}

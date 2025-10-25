// INFERENCIA DE TIPOS
// INT
let int1 = 5;
let int2 = -3;

// DOUBLE
let d1 = 0.900931;
let d2 = -3.1415926535;

// BOOLEAN
let b1 = true;
let b2 = false;

// STRING
let s1 = "Hola";
let s2 = "Adios";

// CHAR
let c1 = "a";
let c2 = "b";

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
let contador2 = 0;
while (contador2 < 3) {
  console.log(contador2);
  contador2++;
}

// FOR
for (let i = 2; i < 10; i++) {
  console.log(i);
}

// Do-WHILE
let contador3 = 100;
let pacman = ":v";
do {
  console.log(pacman);
  contador3--;
} while (contador3 >= 0);

// TRY CATCH FINALLY
try {
  let x = 10 / 0;
} catch (e) {
  console.log("Capturado:" + e);
} finally {
  console.log("Bloque finally");
}

// SWITCH
let dia = 1;
switch (dia) {
  case 1:
    console.log("Lunes");
    break;
  case 2:
    console.log("Martes");
    break;
  default:
    console.log("Otro día");
}

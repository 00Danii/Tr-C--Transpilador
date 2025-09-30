<?php
// Comentario de línea
/* Comentario de bloque */

// FUNCION
function suma($a, $b) {
    $resultado = $a + $b;
    return $resultado;
}

// USAR FUNCION
$x = 5;
$y = suma($x, 10);

// IF ELSEIF ELSE
if ($y > 10) {
    echo "Mayor a 10";
} elseif ($y == 10) {
    echo "Es igual a 10";
} else {
    echo "Menor a 10";
}

// WHILE
while ($x > 0) {
    echo $x;
    $x--;
}

// DO WHILE
do {
    $x++;
    echo $x;
} while ($x < 3);

// FOR
for ($i = 0; $i < 3; $i++) {
    echo $i;
}

// FOR CON INCREMENTO PERSONALIZADO
for ($i = 0; $i < 3; $i+=2) {
    echo $i;
}

// TRY CATCH FINALLY
try {
    $z = $y / 0;
} catch ($e) {
    echo e;
} finally {
    echo "Bloque finally";
}

// EXPRESIONES BOOLEANAS
$activo = true;
$inactivo = false;

// INCREMENTO / DECREMENTO
$contador = 0;
$contador++;
$contador--;
?>

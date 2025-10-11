Algoritmo programaPSC
	// Esto es un comentario
	
	Escribir "Hola mundo"
	
	// asignación con <-
	numero1 <- 5
	
	// asignación con =
	numero2 = 10
	
	// numero decimal 
	numero3 <- 2.75
	
	// numero negativo
	numero4 <- -98.76
	
	// Cadenas de Texto 
	texto1 = "Hola"
	
	// Cadena de texto con <- 
	texto2 <- "Adios"
	
	// Estructura Si-Sino
	x = 4
	Si x > 0 Entonces
		Escribir texto1
	Sino
		Escribir texto2
	FinSi
	
    // WHILE
	x = 0
    Mientras x < 10 Hacer
		Escribir x + 1
		x <- x + 1
    FinMientras
	
	// FOR
	Para i <- 1 Hasta 10
		Escribir i
	FinPara
	
	// FOR CON PASO 
	Para j <- 0 Hasta 10 Con Paso 2
		Escribir j
	FinPara
	
  // Do-While
	Repetir
		x <- x - 1
	Hasta Que x <= 0

  // Funcion
  Funcion Sumar(a, b)
    Retornar a + b
  FinFuncion

  // Procedimiento
  Procedimiento Mostrar(x)
    Escribir x
  FinProcedimiento

  // Booleanos
  activo = VERDADERO
  activo = FALSO

FinAlgoritmo
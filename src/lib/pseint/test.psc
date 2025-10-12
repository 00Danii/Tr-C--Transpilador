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
	Para j <- 0 Hasta 10 Con Paso 3
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

  // BLOQUE SWITCH
  Segun opcion
  	Caso 1
  		Escribir "Elegiste uno"
  	Caso 2
  		Escribir "Elegiste dos"
  	De Otro Modo
  		Escribir "Opción inválida"
  FinSegun

	// Funcion con parametros y retorno
  Funcion Sumar(a, b)
    Retornar a + b
  FinFuncion
  resultado <- Sumar(3, 4)
  Escribir resultado


  // Arreglos
  Dimension numeros[5]
  numeros[0] <- 10
  numeros[1] <- 20
  numeros[2] <- 30
  numeros[3] <- 40
  numeros[4] <- 50
  Escribir numeros[2]

  // mostrar varios datos
  Escribir datos[0], datos[1], datos[2]
	
FinAlgoritmo
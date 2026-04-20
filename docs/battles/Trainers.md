# Combates contra entrenadores

## **Definir un combate** <a name="definition"></a>
Para crear un combate contra un entrenador, previamente es necesario definirlo en el PBS "trainers.txt". Para ello se sigue la siguiente estructura:
~~~
#-------------------
CAMPER              <-- Nombre interno del tipo de entrenador
Liam                <-- Nombre del entrenador
2                   <-- Número de Pokémon
DIGLETT,10          <-- Primer Pokémon y su nivel.
BONSLY,11           <-- Segundo Pokémon y su nivel.
#-------------------
~~~
Donde entrenador nuevo se separa por `#-------------------` de los demás. 
Estos son los campos obligatorios que todo entrenador debe tener; además de estas se pueden añadir otras opciones:

| Líneas  | Descripción  | Ejemplo |
| ------------ | ------------ | ------------ |
| 1 | Tipo de entrenador | YOUNGSTER |
| 2 | Nombre del entrenador, Variante | Ben, 1 |
| 3 | Número de Pokémon, Items | 2, FULLRESTORE |
| 4-9 | Equipo del entrenador | RATTATA,11 <br> EKANS,11 <br> 

La variante de un entrenador se utiliza para definir varios entrenadores con el mismo nombre pero distinto equipo, por ejemplo:
```
CAMPER
Liam, 0
1
BULBASAUR, 5
#-------------------
CAMPER
Liam, 1
1
SQUIRTLE, 5
#-------------------
CAMPER
Liam, 2
1
CHARMANDER, 5
```
Esto es útil, por ejemplo, para definir a un rival cuyo equipo depende de la elección de inicial del jugador.

Podemos modificar cada uno de los Pokémon que tenga un entrenador añadiendo argumentos separados por comas después del nivel: 
~~~
LEADER_Brock
Brock
2,FULLRESTORE,FULLRESTORE, HYPERPOTION
GEODUDE,12,,DEFENSECURL,HEADSMASH,ROCKPOLISH,ROCKTHROW,0,M,,,,20
ONIX,14,SITRUSBERRY,HEADSMASH,ROCKTHROW,RAGE,ROCKTOMB,0,M,,shiny,,20,,Rocky,,19
~~~

Cada posición representa un parámetro distinto:

| Posición  | Descripción  | Valores válidos | Valor por defecto
| ------------ | ------------ | ------------ | ------------ 
|1| Especie del Pokémon | Nombres internos de Pokémon | Campo obligatorio
|2| Nivel | [1,100] | Campo obligatorio
|3| Objeto equipado | Nombres internos de objetos | Nada
|4| Movimiento #1 | Nombres internos de movimientos | Movimientos aprendidos por nivel
|5| Movimiento #2 | Nombres internos de movimientos | SMovimientos aprendidos por nivel
|6| Movimiento #3 | Nombres internos de movimientos |Movimientos aprendidos por nivel
|7| Movimiento #4 | Nombres internos de movimientos | Movimientos aprendidos por nivel
|8| Habilidad     | <ul><li>0 - Habilidad primaria </li><li>1 - Habilidad secundaria </li><li>2-5 - Habilidad oculta </li></ul> | Habilidad correspondiente según ID
|9| Género        | M / F | Al azar
|10| Forma        | Valores numéricos | 0
|11| Variocolor   | `shiny` / nada | Nada
|12| Naturaleza   | Nombres internos de naturalezas | Al azar
|13| IVs          |[0,31]  | 10
|14| Felicidad    |[0,255] | 70
|15| Mote         |Cadena de caracteres de longitud máxima 10 | Nada
|16| Pokémon Oscuro |true / false | Falso
|17| Poké Ball    |[0, 23] | 0

Cualquiera de estos campos (no obligatorios) puede dejarse en blanco si no es necesario, como en el ejemplo de arriba: 

```
ONIX,14,SITRUSBERRY,HEADSMASH,ROCKTHROW,RAGE,ROCKTOMB,0,M,,shiny,,20,,Rocky,,19
```
Donde los campos correspondientes a forma, naturaleza y felicidad se han dejado en blanco.

## **Crear un combate en un evento** <a name="setup"></a>
Para comenzar un combate desde un evento, se crea un condicional con la siguiente llamada a script: 
```
pbTrainerBattle(:TIPO, "Nombre", _I("Diálogo final"), false, 0, false, 0)
```

| Parámetro  | Descripción  | Valor por defecto | Ejemplo
| ------------ | ---- | ------------ | -
|1 | Nombre interno del tipo de entrenador | Obligatorio |:CAMPER
|2 | Nombre del entrenador (debe coincidir con el del PBS) | Obligatorio | "Liam"
|3 | Frase que dirá al ser derrotado | Ninguno | "¡Eres muy fuerte!"
|4 | Determina si el combate es doble o no | false| 
|5 | Determina la variante a usar del entrenador | 0|
|6 | Determina si el combate se puede perder | false
|7 | Determina la variable del juego en la que se almacenará el resultado del combate | 0

En caso de que el combate se pueda perder (y se pierda), el evento continuará su proceso, ejecutando la excepción del condicional en caso de haberla, sin ejecutar el cuerpo del condicional.

![Ejemplo](script_example.png)

<font size="2">Ejemplo de un combate que se puede perder.</font>

El resultado del combate aparecerá en la variable especificada, tomando los siguientes valores: 

|Valor| Singificado
|-|-
1| Victoria
2| Derrota
3| Huida
4| Captura
5| Empate

Con esto, cuando el evento llegue al punto donde se encuentra nuestro condicional, el combate dará comienzo.

## **Crear un entrenador de ruta** <a name="rute"></a>
A la hora de crear un entrenador de ruta, hay dos formas de hacerlo: usar el script previamente mencionado, o usar anotaciones. Si bien el segundo método es más cómodo, puede dar errores y funcionar de forma distinta a la esperada en algunas ocasiones.

El primer paso para crear un entrenador de ruta es cambiar el nombre del evento a Trainer(X), donde X es la distancia máxima en casillas a la que te podrá detectar el entrenador.

![Ejemplo](trainername_example.png)

<font size="2">Ejemplo de nombre de un entrenador</font>

Además, se debe poner su método de activación en "Colisionar" o "Event Touch".

![Ejemplo](eventouch_example.png)


A partir de aquí hay dos opciones:

1. <font size="3">*Anotaciones*</font>:

    Para usar anotaciones, se añaden comentarios desde RPG Maker al comienzo del evento. Al compilar el juego, estos entrenadores se crearan de forma automática. 

    ![Ejemplo](comment_example.png)

    <font size="2">Ejemplo de un entrenador creado por comentarios</font>

    Hay varios comentarios distintos que se pueden utilizar para configurar nuestro entrenador
    
    |Anotación | Descripción | Valores válidos | Obligatoria
    |-|-|-|-
    |Battle:| Texto que dice el entrenador al verte | Texto|Sí
    |Type:| Tipo del entrenador |Tipo de entrenador| Sí
    |Name:| Nombre del entrenador|Texto | Sí
    |EndSpeech:| Texto que dirá al ser derrotado |Texto| No
    |EndBattle:| Texto que dirá al volver a hablar con él tras ser derrotado |Texto| No
    |RegSpeech:| Texto que dirá al agregar su número de teléfono | Texto|No
    |BattleID:| Variante a usar del entrenador | Número (siempre y cuando la variante exista) | No
    |DoubleBattle: yes| Determina si es un combate doble | yes | No
    |Continue: yes| Determina si el evento continua después de perder el combate | yes | No
    EndIfSwitch: | Si el interruptor seleccionado está activo, se considera que el combate ya se ha ganado (aunque no se haya ejecutado) | Número | No
    |VanishIfSwitch:| Si el interruptor seleccionado está activo, el evento desaparece | Número | No
    |Backdrop:| Determina el fondo del combate | Nombres de fondos de batalla (sin incluir `battlebg`) | No
    |Outcome:| Variable donde se almacena el resultado | Número | No

2. <font size="3">*Llamada a Script*</font>

    Para crear un entrenador por llamada a script, simplemente hay que poner el condicional del apartado [2](#setup) en el cuerpo del evento que cumple las condiciones previas. Con esto, el entrenador funcionará como un entrenador de ruta. Dentro del condicional deberemos encender un interruptor local y crear una nueva página que se active junto a este interruptor.

    Para terminar de retocar nuestro entrenador, escribiremos antes del condicional el diálogo que dirá cuando nos encuentre, así como el script 
    ```
    pbTrainerIntro(:TIPO)
    ```
    para que suene la música asociada a su tipo de entrenador antes del combate. Por último, al final se añade el script 
    ```
    pbTrainerEnd
    ```
    quedando tal que así:

    ![Ejemplo](trainer_example.png)

    <font size="2">Primera página de un entrenador</font>

    ![Ejemplo](trainer2_example.png)

    <font size="2">Segunda página de un entrenador</font>

Con esto, ya podemos crear entrenadores de ruta de forma fácil.

## **Combates dobles** <a name="doubles"></a>

Hay 3 formas de comenzar un combate doble:

- Un solo entrenador 
- Dos entrenadores en pareja
- Dos entrenadores no relacionados

Los dos primeros casos son intencionados, mientras que el último se da cuando dos entrenadores individuales ven al jugador al mismo tiempo. 

1. <font size="3">*Combate doble contra un solo entrenador*</font>
    
    Para crearlo, se debe poner en true el parámetro correspondiente, mencionado en el apartado [2](#setup), y previamente se debe comprobar que el jugador tenga al menos dos Pokémon vivos de la siguiente forma: 
    ```
    $Trainer.ablePokemonCount<=1
    ```
    ![Ejemplo](doublechek_example.png)

    Nótese la importancia del comando "Exit Event Processing" dentro del cuerpo del condicional para evitar problemas.

2. <font size="3">*Combate contra dos entrenadores en pareja*</font>
   
    Este caso se programa igual que el caso 1, solo que en este caso habrá dos NPC en el mapa que comiencen el mismo combate, así que para evitar que este se repita debemos encender el switch local correspondiente al evento del compañero mediante el script
    ```
    pbSetSelfSwitch(ID, "A", true)
    ```
    donde la ID es la del evento del entrenador compañero.

3. <font size="3">*Combate contra dos entrenadores desemparejados*</font>
   
    En este caso, no hace falta programar nada extra. Si dos entrenadores ven al jugador a la vez y este tiene Pokémon suficientes para empezar un combate doble, así se hará. En caso de que el jugador tenga un solo Pokémon vivo, se harán dos combates individuales seguidos.

## **Animaciones de inicio** <a name="animations"></a>
La base incluye una forma fácil de hacer animaciones de inicio similares a las que aparecen en HGSS.

![Ejemplo](vsbar_example.png)

Para que aparezcan al principio de un combate, simplemente hace falta crear los gráficos

- `Graphics/Transitions/vsBarXXX.png`
- `Graphics/Transitions/vsTrainerXXX.png`

donde XXX es el número del tipo de entrenador. Esto quiere decir que las animaciones de entrada van ligadas a un tipo de entrenador, no a uno en concreto.

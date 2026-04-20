# Interruptores y variables

Existen tres elementos determinantes para comprender el funcionamiento de RPG Maker XP y Pokémon Essentials BES, para
así sacar su máximo potencial e influyen en los eventos que ocurren dentro del juego: los interruptores, los
interruptores locales y las variables.

## Interruptores

Los interruptores son un elemento variable que tiene dos estados: encendido (ON) o apagado (OFF). Sirven para activar o
desactivar eventos o condiciones dentro de éstos, controlándolos desde secciones concretas.

- **Condiciones de aparición**: por cada página que componga a un evento, se pueden usar hasta un máximo de dos
  interruptores para activarlo. Un ejemplo: en un mapa hay un evento de dos páginas que tiene la primera en blanco y en
  la segunda, un personaje que inicia un combate. Para que ese personaje aparezca, debe cumplirse su condición de
  aparición, que en este caso será un interruptor. ¿Qué hará que el interruptor se encienda? Otro evento que active ese
  interruptor, como, por ejemplo, uno que haga avanzar la trama. Si se ha llegado a ese punto, el entrenador aparecerá;
  si aún es pronto, no lo hará.
- **Condiciones y efectos (Conditional Branch)**: este es un comando de evento que permite crear condiciones dentro de
  los eventos, para que si se cumplen (o no), ocurra lo que esté programado. Por ejemplo, que un personaje diga cosas
  distintas en función a si se ha obtenido una medalla o no.
- **Mover evento (Set Move Route)**: una de las posibles acciones dentro de este comando de evento es encender o apagar
  un interruptor.

Los interruptores se guardan en una lista, accesible sólo cuando va a elegirse qué interruptor afectará a un evento
concreto en los casos mencionados antes. Cada posición en la lista tiene asignado un número y puede cambiarse su nombre
para localizarlos con facilidad.

Hay algunos interruptores prestablecidos en Pokémon Essentials BES y no deben sobrescribirse (excepto los que van del 51
en adelante, pues son parte del proyecto de prueba, no de la base en sí.)

| ID | Nombre                      | Uso                                                                                                                                                                                                                                                                       |
| -- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Starting over               | En ON cuando el jugador se desmaye y permitir que cosas especiales ocurran. Debe volver a colocarse en OFF una vez acaben.                                                                                                                                                |
| 2  | Seen Pokérus in Poké Center | En ON una vez que se haya identificado al Pokérus por primera vez y así evitar la explicación del mismo vuelva a mostrar.                                                                                                                                                 |
| 3  | Choosing starter            | Usado para determinar si el jugador está en la escena de la elección del inicial.                                                                                                                                                                                         |
| 4  | Defeated Gym 1              | Usado para determinar si el jugador ha derrotado al primer Líder de Gimnasio.                                                                                                                                                                                             |
| 5  | Defeated Gym 2              | Usado para determinar si el jugador ha derrotado al segundo Líder de Gimnasio.                                                                                                                                                                                            |
| 6  | Defeated Gym 3              | Usado para determinar si el jugador ha derrotado al tercer Líder de Gimnasio.                                                                                                                                                                                             |
| 7  | Defeated Gym 4              | Usado para determinar si el jugador ha derrotado al cuarto Líder de Gimnasio.                                                                                                                                                                                             |
| 8  | Defeated Gym 5              | Usado para determinar si el jugador ha derrotado al quinto Líder de Gimnasio.                                                                                                                                                                                             |
| 9  | Defeated Gym 6              | Usado para determinar si el jugador ha derrotado al sexto Líder de Gimnasio.                                                                                                                                                                                              |
| 10 | Defeated Gym 7              | Usado para determinar si el jugador ha derrotado al séptimo Líder de Gimnasio.                                                                                                                                                                                            |
| 11 | Defeated Gym 8              | Usado para determinar si el jugador ha derrotado al octavo Líder de Gimnasio.                                                                                                                                                                                             |
| 12 | Defeated Elite Four         | Usado para determinar si el jugador ha derrotado al Alto Mando.                                                                                                                                                                                                           |
| 13 | Fossil revival in progress  | En ON si el restaurador de fósiles está actualmente ocupado reviviendo uno que el jugador le ha dado. Se vuelve a dejar en OFF cuando ha acabado, en función la condición que se prefiera (por ejemplo, salir por la puerta del laboratorio donde reviven a los fósiles). |
| 14 | s:PBDayNight.isDay?         | En ON durante el día (entre las 6 AM y las 8 PM) y en OFF durante la noche.                                                                                                                                                                                               |
| 15 | s:PBDayNight.isNight?       | En ON durante la noche (entre las 8 PM y las 6 AM) y en OFF durante el día.                                                                                                                                                                                               |
| 16 | s:PBDayNight.isMorning?     | En ON durante la mañana (entre las 6 AM y el mediodía) y en OFF durante el resto del tiempo.                                                                                                                                                                              |
| 17 | s:PBDayNight.isAfternoon?   | En ON durante la tarde (entre el mediodía y las 8 PM) y en OFF durante el resto del tiempo.                                                                                                                                                                               |
| 18 | s:PBDayNight.isEvening?     | En ON durante el atardecer (entre las 5 PM y las 8 PM) y en OFF durante el resto del tiempo.                                                                                                                                                                              |
| 19 | s:pbIsWeekday(-1,2,4,6)     | En ON el martes, jueves y sábado; en OFF, el resto de días.                                                                                                                                                                                                               |
| 20 | s:!pbIsWeekday(-1,2,4,6)    | En ON el lunes, miércoles, viernes y domingo; en OFF, el resto de días.                                                                                                                                                                                                   |
| 21 | s:tsOn?("A")                | En ON si el interruptor temporal (A) está activo y en OFF si no lo está.                                                                                                                                                                                                  |
| 22 | s:tsOff?("A")               | En ON si el interruptor temporal (“A”) está desactivado y en OFF si sí lo está.                                                                                                                                                                                           |
| 23 | s:cooledDown?(86400)        | En ON si han pasado 24 horas (86400 segundos) desde que se configuró la variable del evento (con respecto al momento de entonces) y si el interruptor local A está encendido.                                                                                             |
| 24 | s:cooledDownDays?(1)        | En ON si el día actual es diferente al día en el que se configuró la variable del evento (con respecto al momento de entonces) y si el interruptor local A está encendido.                                                                                                |
| 25 | s:pbInSafari?               | En On si el jugador actualmente se encuentra dentro de la Zona Safari; en OFF, si no lo está.                                                                                                                                                                             |
| 26 | s:pbBugContestUndecided?    | En ON durante el Concurso de captura de bichos.                                                                                                                                                                                                                           |
| 27 | s:pbBugContestDecided?      | En ON cuando el “Concurso de captura de bichos” ha terminado. Se usa para comenzar a juzgar y mostrar las capturas del resto de participantes.                                                                                                                            |
| 28 | s:pbInChallenge?            | En ON si el jugador actualmente está enfrentando uno de los retos del Frente Batalla.                                                                                                                                                                                     |
| 29 | Has National Dex            | Se utiliza para determinar si el jugador tiene la Pokédex Nacional. Sin embargo, no hace que el jugador tenga obtenga dicho objeto.                                                                                                                                       |
| 30 | s:pbNextMysteryGiftID>0     | En ON si hay un Regalo Misterioso descargado que aún no ha sido recogido; en OFF si no hay ninguno.                                                                                                                                                                       |
| 31 | Shiny wild Pokémon          | Mientras está encendido, todos los encuentros con Pokémon salvajes serán variocolor (shiny).                                                                                                                                                                              |
| 32 | Fateful encounters          | Mientras esté encendido, todos los Pokémon creados serán “encuentros fatídicos”. No tiene uso más allá de emular los Pokémon que regalan los eventos oficiales.                                                                                                           |
| 33 | No money lost in battle     | Mientras esté encendido, el jugador no perderá dinero tras perder un combate, pero sí podrá seguir obteniendo dinero si gana.                                                                                                                                             |
| 34 | No Mega Evolution           | Mientras esté encendido, ningún Pokémon podrá megaevolucionar durante el combate, incluso si normalmente podía hacerlo.                                                                                                                                                   |
| 35 | No Ultra Burst              | Mientras esté encendido, impide a Nezcrozma (en concreto, a sus formas fusionadas con Solagaleo o Lunala) transformarse en Ultra-Necrozma.                                                                                                                                |
| 36 | No capturar                 | Mientras esté encendido, impide la captura de Pokémon salvajes.                                                                                                                                                                                                           |

## Interruptores locales

Lo interruptores locales (Self Switch) son, en esencia, lo mismo que los interruptores y su funcionamiento es el mismo.
Pero tienen varias diferencias y limitaciones.

- Sólo pueden usarse dentro de un mismo evento y están limitados a un máximo de 4: A, B, C y D. Eso quiere decir que el
  evento, sólo usando interruptores locales, podría tener un máximo de 5 páginas (una de ellas, sin interruptor).
  Además, sólo puede usarse un interruptor local por página, a diferencia de los interruptores, que pueden ser dos.
- Además de cómo condición de aparición, un interruptor local también puede ser una condición dentro del comando de
  evento Condiciones y efectos (Conditional Branch), pero no del comando Mover evento (Set Move Route) como sí pasa con
  los interruptores.

¿Para qué se utilizan los interruptores locales, entonces? Para eventos sencillos y que no dependan de otros para su
activación, siendo más sencillo utilizar en estos casos los interruptores locales. Un ejemplo: que un personaje entregue
un objeto la primera vez que se hable con él, pero en las siguientes, cambie el diálogo y ya no lo haga.

## Variables

Una variable almacena un valor numérico, siempre números enteros (no decimales). Sirven para multitud de cosas, y para
comprender su funcionamiento, he aquí algunos ejemplos:

- Cantidades (nº de veces que se ha hecho algo, dinero, etc)
- Estados como encendido o apagado, emulando a los interruptores (de hecho, los interruptores son un tipo de variable
  binaria)
- Asignar valores numéricos a opciones (ej: 1 = opción 1, 2 = opción 2, etc)
- Identificadores (como números ID y otros)

Las variables puedan actuar como condición de aparición, al igual que los interruptores y los interruptores locales, y
utilizarse en muchos comandos de evento. Sin embargo, sólo uno de estos comandos permite modificarlas directamente:
Operaciones de variable (Control Variables). La interfaz de este comando se compone de varios elementos.

- **Variable**: cuál se modificará, pudiendo ser una concreta o un rango de ellas.
- **Operación**: al ser un valor numérico, modificarlo implica operaciones matemáticas.
    - **Sustituir (Set)**: establece directamente el valor.
    - **Sumar (Add):** suma al valor actual de la variable.
    - **Restar (Sub)**: resta al valor actual de la variable.
    - **Multiplicar (Mul)**: multiplica el valor actual de la variable.
    - **Dividir (Div)**: divide el valor actual de la variable.
    - **Resto (Mod)**: se le conoce como “operación módulo” en informática. Realiza una división, pero en lugar de dar
      el cociente (resultado), usa el resto de la misma. Ejemplo: dividir 5 entre 2, daría como cociente 2 (sin tomar en
      cuenta decimales) y su resto es 1.
- **Operando**: el valor con el cual se realizará la operación que modificará la variable. Hay varios tipos, algunos de
  los cuales no tienen uso en Pokémon Essentials BES.
    - **Constante**: un número entero.
    - **Variable**: el valor de otra variable
    - **Aleatorio (Random)**: un valor aleatorio dentro de un rango.
    - ~~Objeto (Item)~~
    - ~~Personaje (Actor)~~
    - ~~Enemigo (Enemy)~~
    - **Personaje (Character)**: el jugador o un evento, en relación a uno de estos valores.
        - **Coordenada X (Map X)**: según el valor sobre la coordenada X (horizontal) en la que se encuentre. Se mide en
          casillas, siendo la 0,0 la casilla en la esquina superior izquierda y se cuenta de izquierda a derecha.
        - **Coordenada Y (Map Y)**: según el valor sobre la coordenada Y (vertical) en la que se encuentre. Se mide en
          casillas, siendo la 0,0 la casilla en la esquina superior izquierda y se cuenta de arriba hacia abajo.
        - **Dirección (Direction)**: en función a la dirección a la que esté mirando, habiendo cuatro valores posibles:
          2 (abajo), 4 (izquierda), 6 (derecha) y 8 (arriba).
        - ~~Pantalla X (Screen X)~~
        - ~~Pantalla X (Screen Y)~~
        - **Terreno (Terrain Tag)**: el valor de la etiqueta de terreno (Terrain Tag) que tenga el tile sobre el que es
    - **Otros (Other)**
        - **ID Mapa (Map ID)**: el número ID del mapa donde se encuentra el jugador.
        - ~~Nº Grupo (Party Members)~~
        - **Dinero (Gold)**: el dinero actual del jugador.
        - ~~Oasis (Steps)~~
        - **Tiempo Jugado (Play Time)**: el tiempo de juego actual.
        - **Temporizador (Timer)**: el tiempo que queda en el temporizador activo (en segundos).
        - ~~Nº Guardados (Save Count)~~

Las variables se guardan en una lista, accesible sólo cuando va a elegirse qué variable afectará a un evento concreto en
los casos mencionados antes. Cada posición en la lista tiene asignado un número y puede cambiarse su nombre para
localizarlos con facilidad.

Hay algunos interruptores prestablecidos en Pokémon Essentials BES y no deben sobrescribirse.

| ID | Nombre                         | Uso                                                                                                                                                                                     |
| -- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Temp Pokemon Choice            | Usado para guardar información temporalmente, referida a la elección de un Pokémon durante un combate. También almacena el resultado de una batalla.                                    |
| 2  | Temp Move Choice               | Usado para guardar información temporalmente, referida a la elección de un movimiento durante un combate.                                                                               |
| 3  | Temp Pokemon Name              | Usado para guardar información temporalmente, referida al nombre de un Pokémon.                                                                                                         |
| 4  | Temp Move Name                 | Usado para guardar información temporalmente, referida al nombre de un movimiento.                                                                                                      |
| 5  | Temp Text Entry                | Usado para guardar información temporalmente, referida a la entrada de texto.                                                                                                           |
| 6  | Poké Center healing ball count | Se usa en el Centro Pokémon. Es la cantidad de Poké Balls que se mostrarán en la máquina de curación, que será igual al número de Pokémon que tenga el jugador en su equipo.            |
| 7  | Starter choice                 | Usado para recordar el Pokémon inicial que eligió el jugador. Generalmente, los valores asignados son:<ul><li>1 = Planta<li>2 = Fuego<li>3 = Agua</ul>                                   |
| 8  | Apricorn being converted       | Usado por el artesano de bonguris. Es el número ID del bonguri que se está convirtiendo, o el número ID de la Poké Ball resultante.                                                     |
| 9  | Fossil being revived           | Usado por el restaurador de fósiles. Es el número ID del fósil que se está reviviendo, o el número de la especie del Pokémon resultante.                                                |
| 10 | Elevator current floor         | Se usa en los mapas con ascensor, siendo el piso en el que se encuentra actualmente el ascensor. Debería modificarse este valor en los eventos de las puertas que lleven a un ascensor. |
| 11 | Elevator new floor             | Se usa en los mapas con ascensor, siendo el piso al que quiere ir el jugador. Debe modificarse este valor en el evento de los controles del ascensor.                                   |
| 12 | Rival name                     | Guarda el nombre del rival.                                                                                                                                                             |
| 13 | E4 defeated count              | Es la cantidad de veces que se ha vencido al Alto Mando y se ingresa al Hall de la Fama.                                                                                                |
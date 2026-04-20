# Definir movimientos

Los movimientos quedan definidos en el archivo **"moves.txt"**, situado en la carpeta del PBS. Cada línea corresponde a un movimiento, por lo tanto, para crear un nuevo movimiento es necesario añadir una nueva línea.

```
1,MEGAHORN,Megacuerno,000,120,BUG,Physical,85,10,0,00,0,abef,"Violenta embestida con cuernos imponentes."
```

En esta imagen de ejemplo se puede ver la línea que define el movimiento Megacuerno. Como se puede apreciar, hay varias partes separadas por comas que definen (en el mismo orden) los siguientes elementos del movimiento:

| Parte  | Elemento  | Descripción  |
| ------------ | ------------ | ------------ |
| 1  | Número ID  | El **número ID** de cada movimiento debe ser diferente, siempre y cuando sea un número comprendido entre el **1** y el **999**. Saltarse un número es válido (es decir, del 100 puedes pasar al 120 sin problemas).  |
| 2  | Nombre interno  | Es el nombre que no ve el jugador y sirve para definirlo y poder gestionarlo en scripts y eventos. Se escriben en mayúscula, sin espacios ni símbolos.  |
| 3  | Nombre en uso  | Es el nombre que ve el jugador dentro del juego. Puede escribirse con espacios y tildes sin ningún problema.  |
| 4  | Código de función  | También conocido como **efecto del movimiento**, sirve para definir qué función específica va a desempeñar este movimiento (más allá del daño, precisión, etc...). Existe una ámplia lista de códigos de función que vienen definidos en el script **PokéBattle_MoveEffects**. Se escriben utilizando 3 dígitos en hexadecimal.  |
| 5  | Potencia  | Determina el **daño base** que causará el movimiento. Es **0** para que el movimiento sea de estado, por lo que no inflingirá daño. Es **1** si el movimiento calcula luego el daño base (dependiendo de varios factores como el peso del Pokémon, etc...). Para los movimientos de golpes múltiples, será el daño individual de cada golpe.  |
| 6  | Tipo  | Determina el **tipo elemental** del movimiento. Se debe escribir el nombre interno del tipo (consultar en el archivo "types.txt" de la carpeta PBS).  |
| 7  | Categoría  | Sirve para determinar la categoría del movimiento. **Physical** (Físico, por lo que calcula estadísticas de Ataque y Defensa), **Special** (Especial, por lo que calcula estadísticas de Ataque Especial y Defensa Especial) y **Status** (Estado, por lo que no inflinge daño).  |
| 8  | Precisión  | Indica la **precisión** del movimiento, sobre 100. Es **0** si el movimiento no varía en relación a la precisión, es decir, que nunca falla.  |
| 9  | PP  | Cantidad de **PP** que tiene por defecto el movimiento. Es **0** si puede usarse infinitamente.  |
| 10  | Probabilidad del efecto  | Determina la probabilidad (sobre 100) de que ocurra el **efecto del movimiento** indicado en el código de función. Es **0** si el movimiento solo realiza su efecto (por ejemplo, movimientos de estado).  |
| 11  | Objetivo  | Determina los **objetivos** que serán alcanzados por el movimiento. Pueden ser: **00** (Un Pokémon distinto al asuario), **01** (Sin objetivos), **02** (Un Pokémon rival al azar), **04** (Todos los Pokémon rivales), **08** (Todos los Pokémon excepto el usuario), **10** (Usuario), **20** (Ambas zonas del campo de batalla, por ejemplo, Pantalla Luz), **40** (Zona del usuario), **80** (Zona del rival), **100** (Compañeros del usuario), **200** (Elección del jugador o compañero del usuario, por ejemplo, Acupresión), **400** (Un solo Pokémon de la zona enemiga, por ejemplo, Yo Primero), **800** (Pokémon enfrente de la zona rival, usado por Maldición). |
| 12  | Prioridad  | Indica la **prioridad** base del movimiento. Debe ser un valor comprendido entre **-6** y **6**. Los valores más bajos indican menor prioridad y viceversa. Si dos movimientos tienen la misma prioridad, serán utilizados dependiendo de la Velocidad de los atacantes.  |
| 13  | Banderas  | Las banderas sirven para añadir **condiciones extra** a los movimientos. Pueden ser: **a** (movimiento de contacto físico), **b** (Se puede evitar con Protección o Detección), **c** (Se puede redirigir con Capa Mágica. Las banderas c y d se usan de manera mutua), **d** (Se puede robar su efecto con Robo. Las banderas c y d se usan de manera mutua), **e** (Puede ser copiado por Mov.Espejo), **f** (Posibilidad de hacer retroceder si se sostiene una Roca del Rey), **g** (Descongela al usuario al utilizarse), **h** (Alta probabilidad de golpe crítico), **i** (Movimiento de cura), **j** (Movimiento de perforación), **k** (Movimiento de sonido), **l** (Movimiento deshabilitado si Gravedad está en uso).  |
| 14  | Descripción  | Indica la **descripción del movimiento** que se mostrará dentro del juego. Debe escribirse entre comillas. Las comillas dobles en la descripción deben ir precedidas por una barra invertida "\".  |


Para que un nuevo movimiento pueda ser aprendido por MTs, MOs o tutores de movimiento, debe añadirse una sección en el archivo **"tm.txt"** de la carpeta PBS.

```
[HONECLAWS]
CHARMANDER,CHARMELEON,CHARIZARD,etc...
```

En la imagen de ejemplo se puede ver que el movimiento Afilagarras tiene su sección dentro del archivo PBS. Para añadir uno nuevo hay que hacer lo siguiente:

1. Añadir una nueva línea y escribir entre corchetes el nombre interno del movimiento (Ejemplo: [MEGAHORN]).

2. Bajar un renglón (pulsar enter) y escribir de forma contínua (separados por comas) el nombre interno de los Pokémon que aprenderán ese movimiento, ya sea mediante tutor de movimientos, MT o MO. El orden de los Pokémon no se tiene en cuenta. (Ejemplo: BEEDRILL,SANDSHREW,SANDSLASH,etc...).

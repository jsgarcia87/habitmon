# Definir un Pokémon

Definir un Pokémon es el equivalente a decirle a tu juego que dicho Pokémon existe; implica la descripción de su nombre, tipo, ataques y otras características destacables del mismo. Un Pokémon puede tener varias especies], en cuyo caso estaremos hablando de una [especie base](#definir-una-especie-base) y [sus distintas formas](#formas-alternativas), que trabajarán modificando la misma. 

## Definir una especie base

La especie base se define en el [PBS](pbs.md) pokemon.txt tal y como sale a continuación. Como se puede observar, es una sección iniciada por el número ID del Pokémon, es decir, su número en la Pokédex nacional (en este caso, [1]), dividida en diferentes subsecciones.

```
[1]
Name=Bulbasaur
InternalName=BULBASAUR
Type1=GRASS
Type2=POISON
BaseStats=45,49,49,45,65,65
GenderRate=FemaleOneEighth
GrowthRate=Parabolic
BaseEXP=64
EffortPoints=0,0,0,0,1,0
Rareness=45
Happiness=70
Abilities=OVERGROW
HiddenAbility=CHLOROPHYLL
Moves=1,TACKLE,3,GROWL,7,LEECHSEED,9,VINEWHIP,13,POISONPOWDER,13,SLEEPPOWDER,15,TAKEDOWN,19,RAZORLEAF,21,SWEETSCENT,25,GROWTH,27,DOUBLEEDGE,31,WORRYSEED,33,SYNTHESIS,37,SEEDBOMB
EggMoves=AMNESIA,CHARM,CURSE,ENDURE,GIGADRAIN,GRASSWHISTLE,GRASSYTERRAIN,INGRAIN,LEAFSTORM,MAGICALLEAF,NATUREPOWER,PETALDANCE,POWERWHIP,SKULLBASH,SLUDGE
Compatibility=Monster,Grass
StepsToHatch=5355
Height=0.7
Weight=6.9
Color=Green
Habitat=Grassland
RegionalNumbers=1,231
Kind=Seed
Pokedex=Bulbasaur can be seen napping in bright sunlight. There is a seed on its back. By soaking up the sun's rays, the seed grows progressively larger.
BattlerPlayerY=0
BattlerEnemyY=25
BattlerAltitude=0
Evolutions=IVYSAUR,Level,16
```

En la definición de una especie existen líneas necesarias y líneas opcionales. En caso de no necesitarlos, se puede borrar la línea o incluso lo que aparece tras el símbolo de igual.

### Contenido obligatorio

Cada especie base debe contener obligatoriamente todas las líneas indicadas en la tabla de debajo, aunque pueden disponerse en cualquier orden. A continuación, se detallan los posibles contenidos de cada línea.

|   Dato|Descripción   |
|---|---|
| Name |El nombre del Pokémon y cómo se mostrará en el juego. |
|InternalName| El nombre interno. Es el que se utiliza en el código para hacer referencia a sí mismo. No se mostrará en el juego. Se escribe siempre en mayúsculas sin espacios. |
|Type1<br>Type2| Los tipos del Pokémon, referidos por su nombre interno. El tipo 2 es opcional. |
|  BaseStats |  Características base del Pokémon. Seis valores del 0 al 255, separados por comas. Cada uno corresponde a:<br>```PS, Ataque, Defensa, Velocidad, Ataque especial, Defensa especial```|
|  GenderRate  | La probabilidad de que un Pokémon tenga determinado género. Debe ser una de las siguientes opciones:<br><ul><li>AlwaysMale (Siempre macho)</li><li>AlwaysFemale (Siempre hembra)</li><li>FemaleOneEight (12.5 % de hembra)</li><li>Female25Percent (25 % de hembra)</li><li>Female50Percent (50 % de hembra)</li><li>Female75Percent (75 % de hembra)</li><li>FemaleSevenEights (87.5 % de hembra)</li><li>Genderless (Sin sexo) </li></ul>|
| GrowthRate  | El ratio al que el Pokémon gana experiencia, es decir, a qué velocidad consigue la experiencia que necesita para subir de nivel. La seguirán todas sus evoluciones, y debe de ser una de las siguientes opciones:<br><ul><li>Fast (Rápido): Los Pokémon en este grupo necesitan 800.000 puntos de experiencia para alcanzar el nivel 100. Muchos Pokémon tipo normal o hada pertenecen a este grupo; incluye Pokémon como Azurill, Mawile o Spoink.</li><li>Medium o Medium Fast (Medio): Los Pokémon en este grupo necesitan 1.000.000 puntos de experiencia para alcanzar el nivel 100. Es uno de los grupos más numerosos. Incluye Pokémon como Zubat, Eevee o Pikachu.</li><li>Slow (Lento): Los Pokémon en este grupo necesitan 1.250.000 puntos de experiencia para alcanzar el nivel 100. Está reservado para Pokémon raros, legendarios o pseudo-legendarios. Incluye Pokémon como Magikarp, Zapdos o Larvitar.</li><li>Parabolic o Medium Slow (Parabólica): Los Pokémon en este grupo necesitan 1.059.860 puntos de experiencia para alcanzar el nivel 100, pero suben de nivel más rápidamente a niveles bajos y viceversa. Es uno de los grupos más numerosos. Incluye Pokémon como los iniciales, Mareep o Fletchling.</li><li>Erratic (Errática): Los Pokémon de este grupo necesitan 600.000 puntos de experiencia para alcanzar el nivel 100, pero suben de nivel más rápidamente a niveles altos y viceversa. Incluye Pokémon como Applin, Feebas o Swablu.</li><li>Fluctuating(Fluctuante): Los Pokémon de este grupo necesitan 1.640.000 puntos de experiencia para alcanzar el nivel 100. Suben rápido de nivel a niveles bajos, pero su crecimiento comienza a ralentizarse a partir del nivel 36. Incluye Pokémon como Drifloon, Shroomish y Gulpin, y no suele ser usado.</ul><br>Para más información respecto a las fórmulas y las gráficas de cada una de las diferentes curvas, visita [el siguiente enlace de Wikidex](https://www.wikidex.net/wiki/Experiencia#Niveles)|
| BaseEXP  | La experiencia base que se gana al derrotar a este Pokémon. Se modifica después de acuerdo a la fórmula de final de batalla y variables como el nivel del rival. Es un número entre 0 y 65.535.|
| EfforPoints  | [Los puntos de estuferzo](https://www.wikidex.net/wiki/Puntos_de_esfuerzo) ganados al derrotar a un Pokémon de esta especie. Se compone de seis números separados por comas, tradicionalmente del 0 al 3. Cada uno corresponde a:<br>```PS, Ataque, Defensa, Velocidad, Ataque especial, Defensa especial```|
| Rareness  | La rareza; el ratio de captura del Pokémon. Es un número entre 0 y 255. A mayor valor, mayor probabilidad.|
| Happiness  | La felicidad base tras capturar al Pokémon. Tradicionalmente 70, aunque puede ser cualquier número entre 0 y 255.|
| Moves  | Los movimientos que puede aprender el Pokémon al subir de nivel. Se escriben poniendo el nivel y el nombre interno separado por comas, tal que:<br>```Nv,Nombre interno```<br>Asimismo, para añadir otro movimiento, se separa cada pareja de datos por una coma en la misma línea. Por ejemplo:<br>```1,SCRATCH,1,GROWL,7,EMBER,10,SMOKESCREEN```|
| Compatibility  | El [grupo huevo](https://www.wikidex.net/wiki/Grupo_de_huevo) de la especie. Pueden ser una o dos palabras separada por coma. Si se utiliza como grupo huevo "Undiscovered", esa especie no podrá reproducirse. Los grupos huevos son:<br><ul><li>Monster (Monstruo): Pokémon con rasgos de bestia, de dinosaurio o de reptil</li><li>Bug (Bicho): Pokémon con fisonomía insectoide</li><li>Flying (Volador): Pokémon con fisonomía de ave</li><li>Field (Campo): Pokémon semejantes a mamíferos y animales terrestres</li><li>Fairy (Hada): Pokémon tipo hada o pequeños y adorables</li><li>Grass (Planta): Pokémon tipo planta en su mayoría</li><li>Humanlike (Humanoide): Pokémon con fisonomía humanoide</li><li>Mineral (Mineral): Pokémon minerales o artificiales</li><li>Amorphous (Amorfo): Pokémon que carecen de una fisonomía clara</li><li>Water1 (Agua 1): Pokémon de tipo agua insipirados en anfibios, mamíferos y reptiles</li><li>Water2 (Agua 2): Pokémon de tipo agua con aletas</li><li>Water3 (Agua 3): Pokémon tipo agua inspirados en artrópodos y fósiles</li><li>Dragon (Dragón): Pokémon con apariencia de dragón, reptiles o anfibios</li><li>Undiscovered (Desconocido): Legendarios, Pokémon bebés o Pokémon raros como Unown o los fósiles de Galar.</li><li>Ditto: Reservado para Ditto. Se puede reproducir con todos los Pokémon, salvo con los Undiscovered</li></ul>|
| StepsToHatch  | La cantidad de pasos que necesita un huevo de esta especie para eclosionar. Suele usarse un múltiplo de 255 o 256, habitualmente 5355.  |
|  Height |  Altura del Pokémon en metros, con una cifra decimal separada con un punto. Si el juego reconoce que el jugador es de EEUU, mostrará la altura en pies en su lugar. |
|  Weight | El peso del Pokémon en kilogramos, con una cifra decimal separada con un punto. Si el juego reconoce que el jugador es de EEUU, mostrará el peso en libras en su lugar. |
|  Color | El color principal de la especie. Debe ser uno de los siguientes:<br>```Black, Blue, Brown, Gray, Green, Pink, Purple, Red, White, Yellow```|
| Kind  | La especie del Pokémon. Solo es necesario la categoría; la palabra "Pokémon" se agrega desde los scripts. Por ejemplo:<br>```Kind=Semilla``` |
|  Pokedex | La descripción del Pokémon en la Pokédex |

### Contenido opcional

Los siguientes campos pueden estar ausentes a la hora de definir un Pokémon en el PBS. 

|   Dato|Descripción   |
|---|---|
| Abilities | Las habilidades del Pokémon por su nombre interno, separadas por una coma. Se pueden añadir un máximo de 2. Por ejemplo:<br> ```Abilities=SNOWCLOAK,SLUSHRUSH```<br><br>Al ser opcional, un Pokémon sin este campo no tendrá ninguna, apareciendo su descripción en blanco. La habilidad posicionada primer lugar se corresponde con la primera de su evolución. De esta forma, si un Pokémon tiene ```Abilities=HYDRATION,SHELLARMOR``` y su evolución ```Abilities=HYDRATION,STICKYHOLD```, Hidratación permanecerá igual, pero Caparazón cambiará a Viscosidad |
|  HiddenAbility | La habilidad oculta del Pokémon. Al igual que el campo anterior, se utiliza el nombre interno y se separan por comas. Se pueden añadir un máximo de 4. |
|  EggMoves | Los movimientos huevo de un Pokémon, es decir, aquellos obtenidos mediante crianza. Se escriben poniendo su nombre interno separado por comas. Por ejemplo:<br>```ASTONISH,CURSE,EARTHPOWER```|
|  Habitat | El hábitat, el lugar dónde aparece el Pokémon. Puede ser:<br>```Cave, Forest, Grassland, Mountain, Rare, RoughTerrain, Sea, Urban, WatersEdge``` |
|  RegionalNumbers | Usado para definir la posición del Pokémon en la Pokédex regional. Un 0 significa que no pertenece a la Dex de esa región. Son tantos números como Pokédex regionales haya, separados por comas. Por ejemplo:<br>```25,22,180```.|
|  WildItemCommon<br>WildItemUncommon<br>WildItemRare | El objeto que lleva un Pokémon salvaje. Se utiliza el nombre interno y cada WildItem corresponde al 50 % (Common), 5 % (Uncommon) y 1 % (Rare). No obstante, si se rellenan los tres con el mismo objeto, la probabilidad pasa a ser 100 %. Por ejemplo, en el caso de Numel, siempre llevará baya Safre, dado que:<br><ul><li>WildItemCommon=RAWSTBERRY</li><li> WildItemUncommon=RAWSTBERRY</li><li>WildItemRare=RAWSTBERRY</ul>|
|  BattlerPlayerY | La altura a la que se posicionará el back de un Pokémon. Cuanto más alto, más abajo aparecerá. 0 por defecto.|
|  BattlerEnemyY | La altura a la que se posicionará el front de un Pokémon. Cuanto más alto, más abajo aparecerá. 0 por defecto. |
|  BattlerAltitude | La altura a la que se posicionará el front de un Pokémon respecto a la línea del suelo. Cuanto más alto, más abajo aparecerá. 0 por defecto. Solo puede ser un valor positivo, en cuyo caso se creará una sombra debajo del Pokémon. |
|  Evolution | Las formas que tiene un Pokémon de evolucionar. Se compone de tres elementos, siendo: Nombre interno de la especie a la que evoluciona, método de evolución y tercer argumento (nivel, nombre interno de objeto, nombre interno de movimiento...).<br>Por ejemplo, en Chikorita pondremos:```Evolutions=BAYLEEF,Level,16```<br>Si no hay tercer argumento, se pone la coma, pero se deja en blanco. Por ejemplo, en las evoluciones por felicidad:<br>```Evolutions=TOGETIC,Happiness,```<br>A continuación se describen los diferentes métodos de evolución que aparecen por defecto en la base, separado con una coma su argumento si lo requiere:<br><ul><li>Level, número: Evoluciona al subir al nivel indicado</li><li>LevelMale, número: Evoluciona al subir al nivel indicado si es macho</li><li>LevelFemale, número: Evoluciona al subir al nivel indicado si es hembra</li><li>LevelDay, número: Evoluciona si sube al nivel indicado por el día</li><li>LevelNight, número: Evoluciona si sube al nivel indicado por la noche</li><li>LevelDayTime, número: Evoluciona si sube al nivel indicado, alterando la forma de la evolución dependiendo de si es por el día (0), la noche (1) o el atardecer (2)</li><li>LevelRain, número: Evoluciona si sube al nivel indicado mientras llueve</li><li>LevelDarkInParty, número: Evoluciona si sube al nivel indicado mientras hay un Pokémon siniestro en el equipo</li><li>LevelDayForm0, número: Evoluciona por nivel si la forma del Pokémon es la 0 (especie base) y es por el día</li><li>LevelDayForm1, número: Evoluciona por nivel si la forma del Pokémon es la 1 (forma alternativa/regional) y es por el día</li><li>LevelDayForm2, número: Evoluciona por nivel si la forma del Pokémon es la 2 (forma alternativa/regional) y es por el día</li><li>LevelNightForm0, número: Evoluciona por nivel si la forma del Pokémon es la 0 (especie base) y es por la noche</li><li>LevelNightForm1, número: Evoluciona por nivel si la forma del Pokémon es la 1 (forma alternativa/regional) y es por la noche</li><li>LevelNightForm2, número: Evoluciona por nivel si la forma del Pokémon es la 2 (forma alternativa/regional) y es por la noche</li><li>LevelForm0, número: Evoluciona por nivel si la forma del Pokémon es la 0 (especie base)</li><li>LevelForm1, número: Evoluciona por nivel si la forma del Pokémon es la 1 (forma alternativa/regional)</li><li>LevelForm2, número: Evoluciona por nivel si la forma del Pokémon es la 2 (forma alternativa/regional)</li>----------------------------------------------------------------------<br><li>AttackGreater, número: Evoluciona si el ataque es mayor que la defensa</li><li>AtkDefEqual, número: Evoluciona si el ataque es igual que la defensa</li><li>DefenseGreater, número: Evoluciona si la defensa es mayor que el ataque</li><li>Crits,: Evoluciona si Farfetch'd ha hecho tres críticos y la forma del Pokémon es la 1 (forma alternativa/regional)</li><li>Silcoon, número: Evoluciona si un valor al azar es menor que cinco (sobre diez)</li><li>Cascoon, número: Evoluciona si un valor al azar es mayor o igual que cinco (sobre diez)</li><li>Ninjask, número: Evolución por nivel normal</li><li>Shedinja, número: Si hay una Pokéball en la mochila, se crea un duplicado del Pokémon y cambia a la especie del primer argumento</li><li>Beauty, número: Evoluciona si sube de nivel teniendo el número de belleza requerida</li>----------------------------------------------------------------------<br><li>Item, objeto: Evoluciona por objeto (como por una piedra)</li><li>ItemMale, objeto: Evoluciona por objeto (como por una piedra) si es macho</li><li>ItemFemale, objeto: Evoluciona por objeto (como por una piedra) si es hembra</li><li>DayHoldItem, objeto: Evoluciona si es por el día, tiene el objeto indicado y sube un nivel</li><li>NightHoldItem, objeto: Evoluciona si es por la noche, tiene el objeto indicado y sube un nivel</li><li>HoldItemForm0, objeto: Evoluciona si es la forma 0 (especie base), tiene el objeto indicado y sube un nivel</li><li>HoldItemForm1, objeto: Evoluciona si es la forma 1 ((forma alternativa/regional), tiene el objeto indicado y sube un nivel</li><li>HoldItemForm2, objeto: Evoluciona si es la forma 2 (forma alternativa/regional), tiene el objeto indicado y sube un nivel</li><li>ItemForm0, objeto: Evoluciona por objeto (como una piedra) si la forma de Pokémon es la 0 (especie base)</li><li>ItemForm1, objeto: Evoluciona por objeto (como una piedra) si la forma de Pokémon es la 1 (forma alternativa/regional)</li><li>ItemForm2, objeto: Evoluciona si tiene el objeto indicado, sube un nivel y la forma del Pokémon es la 2 (forma alternativa/regional)</li>----------------------------------------------------------------------<br><li>Happiness,: Evoluciona si alcanza 220 de felicidad y sube un nivel</li><li>HappinessDay,: Evoluciona si alcanza 220 de felicidad y sube un nivel por el día</li><li>HappinessNight,: Evoluciona si alcanza 220 de felicidad y sube un nivel por la noche</li><li>HappinessMoveType, ID del tipo: Evoluciona si alcanza 220 de felicidad y sube un nivel teniendo un movimiento del tipo indicado</li><li>HappinessForm0,Evoluciona si alcanza 220 de felicidad y sube un nivel si la forma de Pokémon es la 0 (especie base)</li><li>HappinessForm1,:Evoluciona si alcanza 220 de felicidad y sube un nivel si la forma de Pokémon es la 1 (forma alternativa/regional)</li><li>HappinessForm2,:Evoluciona si alcanza 220 de felicidad y sube un nivel si la forma de Pokémon es la 2 (forma alternativa/regional)</li>----------------------------------------------------------------------<br><li>HasMove, movimiento: Evoluciona si sube de nivel conociendo el movimiento</li><li>HasMoveForm0, movimiento: Evoluciona si sube de nivel conociendo el movimiento y la forma del Pokémon es la 0 (especie base)</li><li>HasMoveForm1, movimiento: Evoluciona si sube de nivel conociendo el movimiento y la forma del Pokémon es la 1 (forma alternativa/regional)</li><li>HasMoveForm2, movimiento: Evoluciona si sube de nivel conociendo el movimiento y la forma del Pokémon es la 2 (forma alternativa/regional)</li><li>HasInParty, Pokémon: Evoluciona si sube de nivel estando el Pokémon indicado en el equipo</li>----------------------------------------------------------------------<br><li>Location, ID del mapa: Evoluciona si sube de nivel estando en el mapa indicado</li><li>Trade,: Evoluciona si es intercambiado</li><li>TradeItem, objeto: Evoluciona si es intercambiado con un objeto</li><li>TradeSpecies, Pokémon: Evoluciona si es intercambiado por la especie indicada</li>|
|  FormNames | El nombre de cada una de las formas de la especie, separada por comas. Se utiliza solo en la página de la Pokédex. Por ejemplo:<br>Sharpedo: ```FormNames=Mega Sharpedo``` o <br>Darmanitan:```FormNames=Forma Normal,Forma Galar, Forma Daruma, Forma Galar Daruma```|

## Gráficos y sonidos

!!! caution "En proceso (BES)"

    Estamos trabajando en decidir la organización de este tipo de archivo.
    Si necesitas ayuda para ver cómo se hace en la actual 16.3, échale un 
    vistazo al [artículo de la vieja wiki](https://pokemonessentials.fandom.com/es/wiki/Definici%C3%B3n_de_especie).


## Formas alternativas

!!! caution "En proceso (BES)"

    Estamos trabajando en decidir la organización de este tipo de archivo.
    Si necesitas ayuda para ver cómo se hace en la actual 16.3, revisa el
    script de Pokemon_MultipleForms.
# Archivos PBS

Los archivos PBS contienen la información sobre los datos de distintos aspectos del juego, como son los Pokémon, los mapas o los entrenadores. Esta información está escrita en texto plano (.txt) y es modificable con tan solo editar el archivo. Un juego puede funcionar sin los PBS a la hora de ser distribuido: esto es debido a que el [Compilador]() lee estos datos y lo almacena en forma de .rxdata en la [Carpeta Data](ArchivosdePokemonEss.md).

## Lista de archivos PBS principales

Los archivos PBS que hay en el engine son los siguiente:

| Archivo PBS  | Descripción  | 
| ------------ | ------------ |
| abilities | Define las [habilidades de los Pokémon]() |
| conexiones | Define las conexiones entre los mapas. En la versión actual, esta práctica no está recomendada |
| encounters | Define los distintos [tipos de encuentros]() con Pokémon salvajes en cada mapa, así como su probabilidad de encuentro |
| items | Define los objetos del juego |
| metadata | Define los [metadatos](), es decir, los datos globales, válidos para todos los mapas, así como los específicos para cada mapa |
| moves | Define [los movimientos](DefineMovements.md) de los Pokémon |
| phone | Define el texto de los mensajes de teléfono |
| pokemon | Define [las especies de Pokémon](DefPoke.md) |
| shadowmoves | Define los movimentos que aprenden los Pokémon Oscuros |
| townmap | Define los datos del [mapa de la región](), incluyendo los destinos de vuelo |
| trainertypes | Define [los tipos de entrenador]() |
| trainers | Define [los entrenadores](), sus Pokémon y objetos |
| tm | Define los movimientos que pueden aprender los Pokémon por MT/M0 y tutor |
| types | Define [los tipos]() del juego |

## PBS relacionados con las copas de combate

La siguiente lista de archivos está relacionada con las diferentes copas y desafíos que tiene la base por defecto.

| Archivo PBS  | Descripción  | 
| ------------ | ------------ |
| btpokemon | Define los Pokémon de la Torre batalla |
| bttrainers | Define los entrenadores de la Torre batalla |
| fancycuppm | Lista de Pokémon de la [Fancy Cup](https://bulbapedia.bulbagarden.net/wiki/Fancy_Cup) doble |
| fancycuptr | Lista de entrenadores de la [Fancy Cup](https://bulbapedia.bulbagarden.net/wiki/Fancy_Cup) doble |
| fancycupsinglepm | Lista de Pokémon de la [Fancy Cup](https://bulbapedia.bulbagarden.net/wiki/Fancy_Cup) individual |
| fancycupsingletr | Lista de entrenadores de la [Fancy Cup](https://bulbapedia.bulbagarden.net/wiki/Fancy_Cup) individual |
| littlecuppm | Lista de Pokémon de la [Little Cup](https://bulbapedia.bulbagarden.net/wiki/Little_Cup) |
| littlecuptr | Lista de Pokémon de la [Little Cup](https://bulbapedia.bulbagarden.net/wiki/Little_Cup) |
| pikacuppm | Lista de Pokémon de la [Pika Cup](https://bulbapedia.bulbagarden.net/wiki/Pika_Cup) |
| pikacuptr | Lista de Pokémon de la [Pika Cup](https://bulbapedia.bulbagarden.net/wiki/Pika_Cup) |
| pokecuptr | Lista de Pokémon de la [Poke Cup](https://bulbapedia.bulbagarden.net/wiki/Poke_Cup) |
| pokecuppm | Lista de Pokémon de la [Poke Cup](https://bulbapedia.bulbagarden.net/wiki/Poke_Cup) |
| trainerlists | Contiene el índice de documentos para estos desafíos |
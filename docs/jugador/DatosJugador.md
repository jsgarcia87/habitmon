# Datos del Jugador

## Lista de datos
Los datos que posee el jugador se almacenan en la variable global $Trainer. En ella se puede encontrar la siguiente lista de métodos:

| Dato  | Descripción  | 
| ------------ | ------------ |
| $Trainer.name | El nombre del jugador. Por ejemplo, "Red". |
| $Trainer.trainerTypeName | El tipo de entrenador que posee el jugador. Se define en el [archivo PBS](pbs.md) trainertypes.txt. Por ejemplo, "Entrenador".|
| $Trainer.fullname | Devuelve el nombre completo del jugador, es decir "Entrenador Red". |
| $Trainer.id | Este argumento es un número hexadecimal de 8 dígitos (entre 00000000 y FFFFFFFF) |
| $Trainer.publicID | Los últimos 4 dígitos hexadecimales del ID del jugador (número entre 0 y 65535). Este número es el que se muestra en la tarjeta de entrenador, también se muestra como ID EO en un Pokémon originalmente capturado por el jugador. |
| $Trainer.gender | El género del tipo de entrenador que tiene el jugador según lo definido en el PBS (0= masculino, 1= femenino, 2= desconocido). |
| $Trainer.outfit | La apariencia del jugador (esta es 0 por defecto, o cualquier número positivo en caso de cambiarla). |
| $Trainer.language | Un número correspondiente al idioma utilizado por el equipo del jugador. Los Pokémon capturados por el jugador poseen un mismo idioma<br><ol start="0"><li>Desconocido</li><li>Japonés</li><li>Inglés</li><li>Francés</li><li>Italiano</li><li>Alemán</li><li>Español</li><li>Coreano</li></ol> |
| $Trainer.money | La cantidad de dinero que posee el jugador |
| $Trainer.badges | Un array de interruptores, cada uno de estos será TRUE si el jugador tiene la medalla correspondiente y FALSE si no la tiene. Por ejemplo, $Trainer.badge[0] corresponde a la primera medalla, mientras que $Trainer.badge[4] corresponde a la quinta. |
| $Trainer.numbadges | La cantidad de medallas que posee el jugador. Cuenta el total de las medallas de TODAS las regiones.|
| $Trainer.pokegear | Es TRUE si el jugador posee el Pokégear, caso contrario, FALSE.|
| $Trainer.pokedex | Es TRUE si el jugador posee la Pokédex, caso contrario, FALSE. |
| $Trainer.pokedexSeen(dex) | La cantidad de especies de Pokémon que el jugador ha visto según la Dex Regional especificada. El espacio entre paréntesis “(dex)” se deja en blanco o “-1” para contar dentro de la Dex Nacional. |
| $Trainer.pokedexOwned(dex) | La cantidad de especies de Pokémon que el jugador ha visto según la Dex Regional especificada. El espacio entre paréntesis “(dex)” se deja en blanco o “-1” para contar dentro de la Dex Nacional. |
| $Trainer.clearPokedex | Borra la Pokédex |
| $Trainer.party | Un array que contiene hasta 6 elementos, cada elemento corresponde a un Pokémon o un huevo. Este es el equipo del jugador. |

## Usos básicos

Algunos de estos valores se pueden mostrar en un mensaje dentro del juego mediante script. Por ejemplo, el siguiente fragmento de código nos escribirá el nombre del jugador (#{ } se utiliza para escribir variables en strings).

```Kernel.pbMessage("#{$Trainer.name}")``` 

Y este otro nos devolverá la clase y nombre del jugador:

```Kernel.pbMessage("#{$Trainer.fullname }")```

Además, se pueden usar estos valores para comprobar datos específicos en un evento, utilizándolo dentro de un "Condiciones y efectos", como en la siguiente imagen:

![Ejemplo](DatosJugador_1.png)

De esta forma, podemos comprobar que lleves un outfit específico (el 2) para poder interactuar con el evento.
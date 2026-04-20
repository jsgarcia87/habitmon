# Movimientos de campo
Los movimientos de campo pueden cumplir múltiples propósitos, desde sortear obstáculos a curar un pokémon del equipo.

Hay varias maneras de usar ataques fuera de combates:

1. Interactuando con tiles
2. Interactuando con eventos
3. Eligiendo el movimiento desde la pantalla de Equipo

Todos los movimientos pueden ser usados con el último método, pero algunos también pueden ser usados con los otros dos.

A continuación se explicará cómo permitir el uso de movimientos que requieran activación con tiles o eventos.

## Interactuando con tiles

### Surf
Para que el jugador pueda realizar surf sobre un tile este tiene que estar identificado con una [terrain tag de agua](TerrainTags.md). Al realizar el movimiento el jugador podrá moverse por el agua montado sobre su pokémon.

!!! Warning
    Se debe usar un método especial para [teletransportar](MapTransfers.md#Surf) al jugador a otro mapa mientras se usa surf.

### Cascada
Para que el jugador pueda realizar cascada tiene que tener delante un tile con una [terrain tag de cascada](TerrainTags.md). Al usar este movimiento se ascenderá por la cascada, durante el ascenso no sucederán encuentros contra Pokémon salvajes.

### Buceo
Para que el jugador pueda realizar buceo sobre un tile este tiene que tener la [terrain tag de agua profunda](TerrainTags.md). Al realizar el movimiento el jugador se teletransportará a otro mapa, conservando las posición que tenía en el mapa de origen. El mapa de destino se define en los [metadatos del mapa](Metadata.md#divemap).

El mapa subacuático debe tener el mismo tamaño que el de superficie, pues se conservan las coordenadas del jugador de un mapa a otro en ambos sentidos, por tanto es importante asegurarse de que todas las zonas transitables en la zona subacuática también lo sean en la superficie y viceversa.

!!! Note
    La variable DIVINGSURFACEANYWHERE del script `Settings` define si se permite al jugador subir a la superficie desde cualquier parte del mapa subacuático, en caso negativo el jugador solo podrá subir a zonas sobre las que haya un tile de agua profunda.

!!! Warning
    Se debe usar un método especial para [teletransportar](MapTransfers.md#Buceo) al jugador a otro mapa mientras se usa buceo.


## Interactuando con eventos

### Corte
Para poder usar corte en un evento este debe contener los siguientes comandos:
```
@>Mover evento : Este evento
:              : $>Mirar abajo
@> Condiciones y efectos : Script: Kernel.pbCut
  @>Mover evento : Este evento
   :             : $>Esperar : 2 frames
   :             : $>Mirar izquierda
   :             : $>Esperar : 2 frames
   :             : $>Mirar derecha
   :             : $>Esperar : 2 frames
   :             : $>Mirar arriba
   :             : $>Esperar : 2 frames
  @>Esperar a finalizar movimiento
  @>Script: pbEraseThisEvent
  @>
 :  FIN
@>
```
El script `Kernel.pbCut` utilizado en estos eventos ya incluye todos los mensajes de confimación, por lo que no hay que incluirlos en el evento.

!!! Note
    Al cortar un obstáculo este solo desaparece hasta que el jugador se va del mapa, para cortar el árbol permanentemente, se debe remplazar el script pbEraseThisEvent por un comando que setee el Interruptor local A del evento en activado, y agregar una segunda página (en blanco) que dependa de que esté activado este interruptor.

!!! Warning
    El evento deberá tener el nombre `Tree`, puesto que para que desde la pantalla de Equipo se permita usar corte se comprueba que el evento delante del jugador tenga ese nombre.


### Golpe roca
Para poder usar golpe roca en un evento este debe tener los siguientes comandos:
```
@>Mover evento : Este evento
:              : $>Mirar abajo
@>Condiciones y efectos : Script: Kernel.pbRockSmash
  @>Mover evento : Este evento
   :             : $>Esperar : 2 frames
   :             : $>Mirar izquierda
   :             : $>Esperar : 2 frames
   :             : $>Mirar derecha
   :             : $>Esperar : 2 frames
   :             : $>Mirar arriba
   :             : $>Esperar : 2 frames
  @>Esperar a finalizar movimiento
  @>Script: pbEraseThisEvent
  @>Script: Kernel.pbRockSmashRandomEncounter
  @>
 :  FIN
@>
```
El script `Kernel.pbRockSmash` utilizado en estos eventos ya incluye todos los mensajes de confimación, por lo que no hay que incluirlos en el evento.

Al usarse golpe roca, si está definido el tipo de encuentro `RockSmash` para ese mapa, existe un 25% de probabilidad de que ocurra un encuentro con un Pokémon salvaje.

!!! Note
    Al destruir un obstáculo este solo desaparece hasta que el jugador se va del mapa, para destruir la roca permanentemente, se debe remplazar el script pbEraseThisEvent por un comando que setee el Interruptor local A del evento en activado, y agregar una segunda página (en blanco) que dependa de que esté activado este interruptor.

!!! Warning
    El evento deberá tener el nombre `Rock`, puesto que para que desde la pantalla de Equipo se permita usar corte se comprueba que el evento delante del jugador tenga ese nombre.

### Fuerza
Para usar fuerza en un evento este debe tener el siguiente comando:
```
@>Script: pbPushThisBoulder
```

!!! Note
    Este evento a diferencia de los otros no debería activarse con `Pulsar Aceptar`/`Action Button`, para simular el efecto de empujar debe activarse con `Toparse con héroe`/`Player Touch`.

!!! Note
    Para realizar puzzles que requieran mantener la roca sobre un interruptor y esa sea su poisición final o que desaparezcan al caer por un hueco se debe crear otro evento de tipo `Proceso Paralelo`/`Parallel Process` que verifice continuamente la posición de la piedra y llegada al punto deseado active un interrutor para controlar el estado de la misma.

!!! Warning
    El comando usado en el evento solo verifica si ya se había usado fuerza para mover el evento. Para poder usar fuerza la primera vez el evento debe llamarse `Boulder`, lo que hará que estando delante de la roca al pulsar aceptar o desde la pantalla Equipo pregunte si queremos usar fuerza.

### Golpe cabeza
Para usar golpe cabeza en un evento este debe tener el siguiente comando:
```
@>Script: pbHeadbutt
```

El script `pbHeadbutt` utilizado en estos eventos ya incluye todos los mensajes de confimación, por lo que no hay que incluirlos en el evento.

Al sacudir un árbol, si están definidos los tipos de encuentro `HeadbuttLow` y `HeadbuttHigh` para ese mapa, existe una probabilidad de que ocurra un encuentro con un Pokémon Salvaje. El cálculo de la probabilidad del encuentro depende de las coordenadas del árbol y el número de ID de entrenador del jugador. La probabilidad puede ser 10%, 50% u 80%. Para el 10%, se usa el tipo de encuentro `HeadbuttLow`, para el resto de casos se usa `HeadbuttHigh`.

## Solo desde la pantalla de Equipo

Todos estos movimientos se pueden usar de manera automática desde la pantalla de Equipo, solo se requiere un Pokémon que sepa usar el movimiento y en caso de MOs la medalla necesaria.

* Cháchara
* Excavar
* Destello
* Vuelo
* Batido
* Amortiguador
* Dulce Aroma
* Teletransporte
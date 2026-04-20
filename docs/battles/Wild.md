# Combates contra salvajes

## **Encuentros salvajes** <a name="wild"></a>

Los encuentros salvajes se dan de forma aleatoria en determinadas situaciones. Estos encuentros se definen o bien desde la opción `Setear encuentros` del menú de Debug una vez ingame, o desde el PBS `encounters.txt`. 

```
039 # Ruta 4
25,10,10
Land
SHELLOS,12,15
SHELLOS,12,15
SHELLOS,12,15
GRIMER,13,15
GRIMER,13,15
GRIMER,13,15
GRIMER,13,15
GRIMER,13,15
MURKROW,12,14
MURKROW,12,14
MURKROW,12,14
MURKROW,12,14
```
<text font="2">Ejemplo de PBS de encuentros.</font>

Para definir los encuentros de un mapa, se escribe la ID del mapa seguida de tres números separados por comas, que representan la frecuencia o densidad de encuentro en el mapa para los distintos tipos de salvajes: 

- Densidad en hierba.
- Densidad en cueva.
- Densidad en agua (`Surf`).

Cuanto más alto sea este número, más frecuentes serán los encuentros de ese tipo. Los valores por defecto son `25, 10, 10`.

Hay varios tipos de encuentro, y las probabilidades y número de Pokémon permitidos dependen de estos. Cada tipo de encuentro tiene un número de slots predeterminado al que se le asigna un porcentaje de aparición.

|Encuentro|Descripción|Porcentajes|
|-|-|-
|Land|Encuentros de hierba alta normal.<br>Se generan al andar en tiles con [Terrain Tag](../maps/TerrainTags.md) 2.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
|LandMorning|Encuentros de hierba alta normal por la mañana.<br>Se generan al andar en tiles con [Terrain Tag](../maps/TerrainTags.md) 2.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
LandDay|Encuentros de hierba alta normal por el día.<br>Se generan al andar en tiles con [Terrain Tag](../maps/TerrainTags.md) 2.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
LandNight|Encuentros de hierba alta normal por la noche.<br>Se generan al andar en tiles con [Terrain Tag](../maps/TerrainTags.md) 2.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
Cave|Encuentros de cueva.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
BugContest|Encuentros durante un concurso de cazar bichos.| 20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1
Water|Encuentros al usar `Surf`| 60, 30, 5, 4, 1
OldRoad|Encuentros al usar `Caña Vieja` | 	70, 30
GoodRod|Encuentros al usar `Caña Buena` | 60, 20, 20
SuperRod|Encuentros al usar `Super Caña`|40, 40, 15, 4, 1
RockSmash|Encuentros al usar `Golpe Roca`|	60, 30, 5, 4, 1
HeadbuttLow|Encuentros al usar `Cabezazo`|30, 25, 20, 10, 5, 5, 4, 1
HeadbuttHigh|Encuentros al usar `Cabezazo`|30, 25, 20, 10, 5, 5, 4, 1

Para configurarlos, se escribe el nombre del encuentro seguido de los Pokémon que ocuparán cada slot, seguidos de su nível mínimo y máximo.
Si un Pokémon aparece en varios slots, se suman los porcentajes.

```
031 # Ruta 3
25,10,10
Land
NIDORANfE,12,15
NIDORANmA,12,15
NIDORANfE,12,15
NIDORANmA,12,15
PIKACHU,14,17
PIKACHU,14,17
PONYTA,13,15
PONYTA,13,15
EEVEE,15
EEVEE,15
EEVEE,15
EEVEE,15
Water
SURSKIT,13,14
LOTAD,14
LOTAD,14
LOTAD,15
LOTAD,15
RockSmash
NOSEPASS,13,14
GEODUDE,12,15
GEODUDE,12,15
GEODUDE,12,15
GEODUDE,12,15
OldRod
MAGIKARP,6,11
MAGIKARP,10,17
```
<text font="2">Ejemplo con varios encuentros definidos</text>

## **Encuentros de evento** <a name="event"></a>

### **Crear un salvaje** <a name ="create"></a>

No solo es posible crear batallas salvajes mediante encuentros aleatorios. También es posible crear una batalla desde un evento cuando se quiera, usando la siguiente llamada a script:
```ruby
pbWildBattle(species,level,result,escape,canlose)
pbDoubleWildBattle(species1,level1,species2,level2,result,escape,canlose)
```

|Parámetro|Descripción|Ejemplo|
|-|-|-
|Species|Especie del Pokémon salvaje|:PIKACHU
|Level|Nivel del Pokémon salvaje|10
|Result|Número de la variable donde se almacena<br> el resultado del combate: <ul><li>1 - Victoria</li><li>2 - Derrota</li><li>3 - Huída</li><li>4 - Capturado</li><li>5 - Empate</li></ul>| 50
|escape|Determina si se podrá huir o no de la batalla| true / false
|canlose|Determina si el evento continuará después <br>de perder en vez de enviar al jugador al Centro Pokémon|true / false

Así, si llamamos a 
```ruby
pbWildBattle(:PIKACHU,10,50,false,true)
```
habrá un combate contra un Pikachu a nivel 10, del cual no se puede escapar. Si perdemos el combate el evento continuará.<br> El resultado queda grabado en la variable 50 (por ejemplo, podemos comprobar si el jugador ha capturado al Pikachu o lo ha derrotado).

Similarmente, se puede hacer un combate doble contra un salvaje, usando el script:
```ruby
pbDoubleWildBattle(species1,level1,species2,level2,result,escape,canlose)
```

### **Modificar un salvaje** <a name="modify"></a>

Si queremos modificar algún atributo de estos encuentros, debemos hacerlo por script. Debemos añadir el siguiente código:
```ruby
Events.onWildPokemonCreate += proc{|sender,e|
  pokemon = e[0]
  if $game_switches[X]
    
  end
}
``` 
en la sección del editor de scripts `PField_EncounterModifiers` (o en una sección nueva, siempre por encima de `Main`). Aquí, X representa el número de un interruptor que deberá encenderse ANTES de llamar al script `pbWildBattle()` y deberá apagarse justo después de este.

Dentro del 
```ruby
if $game_switches[X]
    
end
```
debemos editar nuestro Pokémon, esto se hace usando los diversos [atributos]() de la clase `PokeBattle_Pokemon`.

```ruby
Events.onWildPokemonCreate += proc{|sender,e|
  pokemon = e[0]
  if $game_switches[X]
    #252 EVs en HP
    pokemon.evs[0] = 252
    #31 IVs en HP 
    pokemon.ivs[0] = 31  
    #Fuerza que su primer movimiento sea Salpicadura
    pokemon.moves[0] = PBMove.new(PBMoves::SPLASH) 
    #Cambia el mote del Pokémon
    pokemon.name = "Kitt"
  end
}
```
<text font="2">Ejemplo de modificación de encuentro.</text>

![Ejemplo](modifier_example.png)
<text font="2">Ejemplo usando el interruptor 60.</text>

## **Pokémon errantes** <a name="roaming"></a>
Nadie usa esto algún día lo haré
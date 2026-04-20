# Crear nuevas etiquetas de terreno

!!! nota

    Esto es un tutorial sobre cómo crear nuevas etiquetas de terreno, para ver las etiquetas incluidas por defecto consulta [el artículo sobre etiquetas de terreno](TerrainTags.md).

Las etiquetas de terreno se definen en el script `PBTerrain`, cada etiqueta tiene un nombre que la identifica y un número, para crear una nueva basta con incluirla al script con un número consecutivo.

En este caso vamos a crear una nueva etiqueta de `Agua Tóxica`, sobre la que se podrá pescar, y surfear, pero al avanzar sobre ella nuestros pokémon irán perdiendo vida e iremos más lento.

```ruby hl_lines="4"
...
Puddle          = 16
Desert          = 17
ToxicWater      = 18
```

## Propiedades heredadas

En caso de que la nueva etiqueta vaya a conservar efectos de otras etiquetas similares, en nuestro caso poder surfear y pescar, podemos agregarla a una de las funciones que comprueban el tipo de etiqueta en el script `PBTerrain`.

Como queremos recrear los efectos del agua normal debemos añadir nuestra etiqueta a todas las funciones que determinan etiquetas de agua:

```ruby hl_lines="6 7 14 15 21 22"
def PBTerrain.isWater?(tag)
  return tag==PBTerrain::Water ||
        tag==PBTerrain::StillWater ||
        tag==PBTerrain::DeepWater ||
        tag==PBTerrain::WaterfallCrest ||
        tag==PBTerrain::Waterfall ||
        tag==PBTerrain::ToxicWater
end

def PBTerrain.isPassableWater?(tag)
  return tag==PBTerrain::Water ||
        tag==PBTerrain::StillWater ||
        tag==PBTerrain::DeepWater ||
        tag==PBTerrain::WaterfallCrest ||
        tag==PBTerrain::ToxicWater
end

def PBTerrain.isJustWater?(tag)
  return tag==PBTerrain::Water ||
        tag==PBTerrain::StillWater ||
        tag==PBTerrain::DeepWater ||
        tag==PBTerrain::ToxicWater
end
```

Añadiremos además otro método para determinar si el tile sobre el que estamos es tóxico:

```ruby
def PBTerrain.isToxic?(tag)
  return tag==PBTerrain::ToxicWater
end
```

## Efectos al caminar sobre la etiqueta

Essentials cuenta con triggers para ejecutar código cada vez que sucede un evento, como iniciar una batalla salvaje, dar un paso, etc.

Los efectos de envenenamiento en el mapa se controlan a cada paso que da el jugador desde el script `PField_Field` usando el trigger `onStepTakenTransferPossible`. Podemos modificar ese código para añadir el efecto de veneno cada vez que se camina por un tile de `ToxicWater`, para saber si estamos sobre un tile de ese tipo podemos usar la función que declaramos anteriorme `PBTerrain.isToxic?`:

```ruby hl_lines="9"
# Poison event on each step taken
Events.onStepTakenTransferPossible+=proc {|sender,e|
  handled=e[0]
  next if handled[0]
  if $PokemonGlobal.stepcount % 4 == 0 && POISONINFIELD
    tag = pbGetTerrainTag($game_player)
    flashed=false
    for i in $Trainer.party
      if (i.status==PBStatuses::POISON || PBTerrain.isToxic?(tag)) &&
         i.hp>0 && !i.isEgg? && !isConst?(i.ability,PBAbilities,:IMMUNITY)
        if !flashed
          $game_screen.start_flash(Color.new(255,0,0,128), 4)
          flashed=true
        end
        if i.hp==1 && !POISONFAINTINFIELD
          i.status=0
          Kernel.pbMessage(_INTL("¡{1} ha sobrevivido al envenenamiento!\\n¡El veneno ha desaparecido!\\1",i.name))
          next
        end
        i.hp-=1
        if i.hp==1 && !POISONFAINTINFIELD
          i.status=0
          Kernel.pbMessage(_INTL("¡{1} ha sobrevivido al envenenamiento!\\n¡El veneno ha desaparecido!\\1",i.name))
        end
        if i.hp==0
          i.changeHappiness("faint")
          i.status=0
          Kernel.pbMessage(_INTL("{1} se ha desmayado...\\1",i.name))
        end
        handled[0]=true if pbAllFainted
        pbCheckAllFainted()
      end
    end
  end
}
```

Para modificar la velocidad de movimiento deberemos editar la función `update` de la clase `Game_Player` en el script `Walk_Run`:

```ruby hl_lines="7 8"
def update
  if PBTerrain.isIce?(pbGetTerrainTag)
    @move_speed = $RPGVX ? 6.5 : 4.8
  elsif !moving? && !@move_route_forcing && $PokemonGlobal
    if $PokemonGlobal.bicycle
      @move_speed = $RPGVX ? 8 : 5.2
    elsif PBTerrain.isToxic?(pbGetTerrainTag)
      @move_speed = $RPGVX ? 3.5 : 2.8
    elsif pbCanRun? || $PokemonGlobal.surfing || $PokemonGlobal.diving
      @move_speed = $RPGVX ? 6.5 : 4.8
    else
      @move_speed = $RPGVX ? 4.5 : 3.8
    end
  end
  update_old
end
```
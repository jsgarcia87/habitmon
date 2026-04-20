# Terrain tags

Las etiquetas de terreno (terrain tags) permiten marcar tiles con efectos especiales, estos pueden ser tales como alterar el rumbo del jugador, generar encuentros salvajes, etc.

Las etiquetas que especifican terrenos sobre los que pueden suceder [combates salvajes](WildBattles.md) también modifican el entorno, lo cual afecta al [fondo de batalla](BattleBackgrounds.md) y a algunos [efectos de movimientos](MoveEffects.md).

[El editor de tilesets de RPG Maker XP](CreatingTilesets.md) solo permite usar etiquetas hasta el ID 7, por lo que tiles que necesiten una etiqueta con ID 8 o superior deben ser marcados desde la opción correspondiente en el menú de Depuración. Por defecto todos los tiles están marcados con el ID 0, el cual no tiene ningún efecto.

Para aprender a crear nuevas etiquetas de terreno consulta el tutorial [Crear nuevas etiquetas de terreno](CreatingTerrainTags.md).

Por defecto se incluyen las siguientes etiquetas de terreno:

| ID  | Nombre  | Detalles |
| ------------ | ------------ | ------------ |
| 1  | Bordillo  | Cuando el jugador pase por un tile con este ID dará un salto en la dirección que está mirando. Este tipo de tiles suelen ser atravesables solo en una dirección para ofrecer un atajo.  |
| 2  | Hierba alta  | Al caminar sobre estos tiles se reproducirá la animación `GRASS_ANIMATION_ID`.<br> Este tipo de tiles deben tener activada la flag Bush (Oscurecer Tiles en español).<br> Estos tiles cuentan como entorno `Grass`.|
| 3  | Arena  | Estos tiles cuentan como entorno `Sand`.  |
| 4  | Roca  |  Estos tiles cuentan como entorno `Rock`. |
| 5  | Agua profunda  | El jugador puede surfear y pescar sobre estos tiles. Cuando [se usa el movimiento Buceo](FieldMoves.md#buceo) el jugador se transportará a otro mapa.<br>Estos tiles cuentan como entorno `MovingWater`. |
| 6  | Agua calmada | El jugador puede surfear y pescar sobre estos tiles. El jugador saldrá reflejado sobre estos tiles, otros eventos también pueden salir reflejados si sus nombres incluyen `Reflection`.<br>Estos tiles cuentan como entorno `StillWater`.  |
| 7  | Agua  | El jugador puede surfear y pescar sobre estos tiles.<br>Estos tiles cuentan como entorno `MovingWater`.  |
| 8  | Cascada  | Estos tiles componen la parte principal de una cascada, salvo la parte superior. El jugador no puede surfear de manera normal por estos tiles. Si un jugador [usa el movimiento Cascada](FieldMoves.md#cascada) en frente de uno de estos tiles ascenderá hasta que deje de estar sobre un tile de `Cascada` o `Cresta de cascada`|
| 9  | Cresta de cascada  | Estos tiles componen la parte superior de una cascada. El jugador puede surfear sobre estos tiles, pero en cuanto lo hagan descenderán por la cascada hasta que dejen de estar sobre un tile de `Cascada` o `Cresta de cascada`.  |
| 10  | Hierba muy alta | Sobre estos tiles el jugador no podrá correr ni usar una bicicleta. En estos tiles hay una probabilidad del 30% de que los encuentros salvajes sean dobles. <br>Estos tiles suelen ocupar 2 tiles de alto: <ul><li>la parte superior del tile debe tener activada la flag Bush (Oscurecer Tiles en español), una prioridad de 1 y esta etiqueta de terreno</li><li>la parte inferior debe tener una prioridad de 0 y la etiqueta de terreno 0</li>|
| 11  | Hierba acuática | Sobre este tile suceden combates salvajes. Como su nombre indica se suele usar con algas en mapas submarinos.|
| 12  | Hielo  | Al pisar uno de estos tiles el jugador se deslizará en la dirección en la que estaba caminando hasta que se choque contra algo que no pueda atravesar o hasta que deje de haber tiles de hielo. Se moverá a la velocidad de movimiento de correr.<br> No se generarán encuentros salvajes mientras el jugador se encuentre sobre un tile de hielo.  |
| 13  | Neutro  | Los permisos de paso de estos tiles son completamente ignorados. Esta etiqueta es útil para tiles meramente estéticos como las sombras de edificios grandes. |
| 14  | Ceniza  | Si el jugador tiene un `Saco hollín` y camina por uno de estos tiles la variable `$PokemonGlobal.sootsack` se incrementará en 1. |
| 15  | Puente  | Consultar [el artículo sobre puentes](Bridges.md) para saber cómo usar esta función.  |
| 16  | Charco  | Estos tiles cuentan como entorno `Puddle`.  |
| 17  | Desierto  | No tiene efecto programado.  |

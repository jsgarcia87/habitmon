# Archivos de Pokémon Essentials

Nada más abrir tu primer proyecto de Essentials, encontrarás multitud de archivos y carpetas. Este artículo te ayudará a navegar por ellas y conocer a fondo las funcionalidades que te tienen que ofrecer.

## Archivos de la carpeta Raíz

|   Archivo / Carpeta | Descripción   |
|---|---|
| Game.exe | Ejectuta el juego como haría con cualquier otro programa. Requiere que exista “Game.ini” |
| Game.ini | Archivo necesario para que la “Game.exe” funcione. Puedes hacer doble click para abrirlo y cambiar el nombre del juego y el archivo RGSS que utiliza para cargarlo |
| Game.rxproj | Permite abrir el proyecto para editarlo con RPG Maker XP |
| townmapgen.html | Editor del mapa de la región. Si sabes HTML puedes abrirlo para alterar sus propiedades |
| selpoint.bpm<br>knownpoint.bpm | Imágenes necesarias para el funcionamiento de la herramienta twonmapgen.html |
| animmaker.exe<br>animaker.txt | Herramienta para hacer animaciones de ataques y su tutorial. Sin uso actualmente |
| Editor.exe | Abre un editor que te permite alterar el contenido de la carpeta PBS. Requiere que exista "Editor.ini" |
| Editor.ini | Archivo necesario para abrir "Editor.exe"
| extendtext.txt | Debe iniciarse mientras estás en el editor de RPG Maker XP (.rxproj) con una caja de texto abierta. Aumenta el ancho de dicha caja|
| gif.dll<br>rubyscreen.dll | Archivos que necesitan ciertos scripts de Essentials |
| RGSS102J<br>RGSS102E<br>RGSS104E | Archivos necesarios para el funcionamiento del proyecto |
| Carpeta PBS | Contiene los [archivos PBS](pbs.md)
| Carpeta Fonts | Contiene las fuentes que utiliza el juego. Requieren instalación si no se usa MKXP.
| Carpeta Graphics |En esta carpeta van los gráficos del juego. Se recomienda .png, pero acepta también .jpg y .bpm. Los contenidos están definidos en [la sección inferior](#carpeta-graphics).
| Carpeta Audio | Contiene los audios del juego. Se recomienda .ogg, pero también acepta .wav y .mp3. Los contenidos están definidos en [la sección inferior](#carpeta-audio)
| Carpeta Data | Archivo necesario para abrir "Editor.exe"

### Carpeta Graphics


|   Archivo / Carpeta | Descripción   |
|---|---|
| Animations | Contiene las imágenes que utilizarán tanto las animaciones de batalla como de mapa. |
| Autotiles | Contiene los autotiles que se pueden utilizar junto a los tiles |
|Battlebacks| Contiene los gráficos que se usan de fondo durante las batallas y sus bases|
|Battlers| Contiene los sprites de los Pokémon, tanto fronts como backs, así como sus sprites variocolores.|
|Characters| Contiene los sprites de los personajes.|
|Fogs| Contiene los gráficos de niebla que se ponen sobre los mapas.|
|GameOvers| Sin uso en Essentials|
|Icons| Contiene los iconos de los bolsillos de la mochila, los iconos de los Pokémon en la party y sus huellas, además de los iconos de los objetos.|
|Panoramas| Contienen los gráficos que se pueden usar debajo de los tilesets de los mapas. Hacen bucle en los bordes.|
|Pictures| Contiene los gráficos de las interfaces y los que se quieran usar o mostrar en el juego. Puede estar dividido en subcarpetas con interfaces específicas. |
|Tilesets|Contiene los [tilesets]() del juego.|
|Titles| Contiene los gráficos de la pantalla de título.|
|Transitions|Contiene los gráficos de las transiciones antes de la batalla|
|Windowskins|Contiene los gráficos de las cajas de texto.|

### Carpeta Audio

|   Archivo / Carpeta | Descripción   |
|---|---|
| Carpeta BGM | Contiene la música del juego. No hace bucle por defecto; debe ponerse mediante un programa externo. |
|Carpeta BGS | Contiene sonidos que hacen bucle automáticamente. |
| Carpeta SE | Contiene los efectos de sonido, sonidos de ataques y los gritos de los Pokémon. |
| Carpeta ME | Contiene canciones de pequeño tamaño o jingles. |

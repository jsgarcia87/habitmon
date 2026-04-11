/**
 * buildingTemplates.js
 * 
 * Plantillas de tiles para los edificios dinámicos en el mapa exterior.
 * Basado en el tileset 'GSC overworld johto day.png'.
 * Cada plantilla es una matriz de IDs de tiles (relativos al ID base 384).
 */

export const BUILDING_TEMPLATES = {
  // Centro Pokémon (4x4 tiles)
  pokemon_center: [
    [692, 693, 694, 695],
    [700, 701, 702, 703],
    [708, 709, 710, 711],
    [716, 717, 718, 719]
  ],

  // Tienda / Poké Mart (4x4 tiles)
  pokemart: [
    [724, 725, 726, 727],
    [732, 733, 734, 735],
    [740, 741, 742, 743],
    [748, 749, 750, 751]
  ],

  // Gimnasio Johto (Estándar, 4x4)
  gym: [
    [660, 661, 662, 663],
    [668, 669, 670, 671],
    [676, 677, 678, 679],
    [684, 685, 686, 687]
  ],

  // Casa Jugador (3x3 tiles)
  house: [
    [544, 545, 546],
    [552, 553, 554],
    [560, 561, 562]
  ],

  // Laboratorio (6x4 tiles wide)
  lab: [
    [624, 625, 626, 627, 628, 629],
    [632, 633, 634, 635, 636, 637],
    [640, 641, 642, 643, 644, 645],
    [648, 649, 650, 651, 652, 653]
  ]
};

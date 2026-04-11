/**
 * interiors.js
 * 
 * Definición manual de mapas para los interiores de los edificios clave.
 * Estos mapas se inyectan en el componente TileMap cuando no existe un JSON en el servidor.
 */

export const INTERIORS = {
  // Centro Pokémon
  'pkmn_center': {
    width: 10,
    height: 8,
    tileset_name: 'gsc pkmn center',
    data: [
      // Capa 0 (Suelo y Paredes)
      // (IDs ficticios basados en un layout de 8 columnas, 
      //  ajustar si se dispone de la imagen exacta)
      [384, 385, 385, 385, 385, 385, 385, 385, 385, 386],
      [392, 393, 393, 393, 393, 393, 393, 393, 393, 394],
      [400, 401, 401, 401, 410, 411, 401, 401, 401, 402], // Fila del mostrador
      [408, 409, 409, 409, 418, 419, 409, 409, 409, 410],
      [416, 417, 417, 417, 417, 417, 417, 417, 417, 418],
      [416, 417, 417, 417, 417, 417, 417, 417, 417, 418],
      [416, 417, 417, 417, 417, 417, 417, 417, 417, 418],
      [424, 425, 425, 426, 427, 427, 428, 425, 425, 426]  // Salida
    ],
    npcs: [
      {
        nombre: 'Nurse Joy',
        sprite: 'nurse_joy',
        posicion: { x: 5, y: 2 },
        direccion: 0,
        mensajes: ['¡Hola! Bienvenido al Centro Pokémon.', '¿Quieres que cure a tus Pokémon?']
      }
    ],
    transfer_out: { mapId: 'Map001', x: 7, y: 9, dir: 0 }
  },

  // Poké Mart
  'pkmn_mart': {
    width: 8,
    height: 8,
    tileset_name: 'gsc pkmn mart',
    data: [
      [384, 385, 385, 385, 385, 385, 385, 386],
      [392, 393, 393, 393, 393, 393, 393, 394],
      [400, 401, 401, 401, 401, 401, 401, 402],
      [408, 409, 409, 409, 409, 409, 409, 410],
      [416, 417, 417, 417, 417, 417, 417, 418],
      [416, 417, 417, 417, 417, 417, 417, 418],
      [416, 417, 417, 417, 417, 417, 417, 418],
      [424, 425, 426, 427, 427, 428, 425, 426]
    ],
    npcs: [
      {
        nombre: 'Vendedor',
        sprite: 'clerk',
        posicion: { x: 2, y: 3 },
        direccion: 2,
        mensajes: ['¡Hola! ¿Buscas algo en especial?', 'Tenemos las mejores Pokéballs.']
      }
    ],
    transfer_out: { mapId: 'Map001', x: 22, y: 9, dir: 0 }
  },

  // Gimnasio (Genérico para Hábitos)
  'pkmn_gym': {
    width: 10,
    height: 12,
    tileset_name: 'gsc lab-gym',
    data: [
      [384, 385, 385, 385, 385, 385, 385, 385, 385, 386],
      [392, 393, 393, 393, 393, 393, 393, 393, 393, 394],
      [400, 401, 401, 401, 401, 401, 401, 401, 401, 402],
      [408, 409, 409, 409, 409, 409, 409, 409, 409, 410],
      [416, 417, 417, 417, 417, 417, 417, 417, 417, 418],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [424, 425, 425, 425, 425, 425, 425, 425, 425, 426],
      [432, 433, 433, 434, 435, 435, 436, 433, 433, 434]
    ],
    npcs: [
      {
        nombre: 'Líder de Gym',
        sprite: 'prof_oak', // Temporal, se verá luego
        posicion: { x: 5, y: 3 },
        direccion: 0,
        mensajes: ['¡Soy el líder de este gimnasio!', '¿Estás listo para demostrar tu hábito?'],
        tipo: 'boss'
      }
    ],
    transfer_out: { mapId: 'Map001', x: 15, y: 16, dir: 0 }
  }
};

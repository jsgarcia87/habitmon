export const WORLD_DATA = {
  Map002: {
    nombre: 'Pueblo Primavera',
    npcs: [
      {
        nombre: 'Guía del Pueblo',
        sprite: 'char_ 00_a',
        posicion: { x: 5, y: 10 },
        direccion: 2,
        mensajes: ['¡Hola! Si buscas el gimnasio de DESAYUNO, está en la Ruta 29.', 'Los de HIGIENE, ORDEN o COMIDA están en Ciudad Fronsaf.', 'Aquí en el pueblo solo tenemos el de VESTIRSE.']
      },
      {
        nombre: 'Madre',
        sprite: 'char_ 11_a',
        posicion: { x: 15, y: 10 },
        direccion: 0,
        mensajes: ['¡Pórtate bien, hijo! Cumple tus hábitos para ganar medallas.', 'Recuerda que en el ORDENADOR de casa puedes ver tus LOGROS pulsando A.']
      },
      {
        nombre: 'Guardia de la Ruta',
        sprite: 'char_ 35_a',
        posicion: { x: 2, y: 11 },
        direccion: 2,
        mensajes: ['¡Alto ahí! No puedes salir de la ciudad sin haber hecho ni un hábito.', 'Completa al menos UNA tarea de tu lista para que te deje pasar.']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'HOGAR', x: 15, y: 7, label: { x: 15, y: 5 } },
      { type: 'gym', gymId: 'vestirse', nombre: 'VESTIMENTA', x: 8, y: 5, label: { x: 8, y: 3 } },
      { type: 'gym', gymId: 'orden', nombre: 'ORDEN', x: 13, y: 15, label: { x: 13, y: 13 } },
      { type: 'gym', gymId: 'higiene', nombre: 'HIGIENE', x: 5, y: 13, label: { x: 5, y: 11 } }
    ],
    exits: {
      left: { targetMap: 'Map008', spawn: { x: 41, y: 11 } }
    },
    isInterior: false
  },
  Map008: {
    nombre: 'Ruta 29',
    npcs: [
      {
        nombre: 'Cazador',
        sprite: 'char_ 01_a',
        posicion: { x: 30, y: 12 },
        direccion: 1,
        mensajes: ['¡Bienvenido a la Ruta 29!', 'En esa casa de ahí está el Gimnasio del Desayuno.', '¡Cruza la hierba alta con cuidado!']
      }
    ],
    buildings: [
      { type: 'gym', gymId: 'desayuno', nombre: 'DESAYUNO', x: 15, y: 7, label: { x: 15, y: 5 } }
    ],
    exits: {
      right: { targetMap: 'Map002', spawn: { x: 1, y: 11 } },
      left: { targetMap: 'Map070', spawn: { x: 34, y: 13 } },
      up: { targetMap: 'Map010', spawn: { x: 22, y: 35 } }
    },
    isInterior: false
  },
  Map070: {
    nombre: 'Ciudad Fronsaf',
    npcs: [
      {
        nombre: 'Guardia',
        sprite: 'char_ 35_a',
        posicion: { x: 20, y: 15 },
        direccion: 2,
        mensajes: ['Bienvenido a Ciudad Fronsaf.', 'Aquí tenemos los gimnasios de HIGIENE, ORDEN, DESAYUNO y COMIDA.']
      }
    ],
    buildings: [
      { type: 'gym', gymId: 'higiene', nombre: 'Higiene', x: 16, y: 5, label: { x: 16, y: 3 } },
      { type: 'gym', gymId: 'orden', nombre: 'Orden', x: 25, y: 5, label: { x: 25, y: 3 } },
      { type: 'gym', gymId: 'comida', nombre: 'Comida', x: 21, y: 13, label: { x: 21, y: 11 } },
      { type: 'gym', gymId: 'cena', nombre: 'Cena', x: 5, y: 20, label: { x: 5, y: 18 } } 
    ],
    exits: {
      right: { targetMap: 'Map008', spawn: { x: 1, y: 13 } },
      up: { targetMap: 'Map010', spawn: { x: 12, y: 18 } }
    },
    isInterior: false
  },
  Map003: {
    nombre: 'Tu Casa - PB',
    npcs: [
      {
        nombre: 'Madre',
        sprite: 'char_ 00_b',
        posicion: { x: 2, y: 4 },
        direccion: 2,
        mensajes: ['¡Hijo! Recuerda que tienes tareas pendientes.', 'Tu ordenador está arriba si quieres ver tus progresos.']
      }
    ],
    buildings: [],
    exits: {
      down: { targetMap: 'Map002', spawn: { x: 15, y: 8 } }
    },
    isInterior: true
  },
  Map004: {
    nombre: 'Tu Casa - P1',
    npcs: [],
    buildings: [
      { type: 'computer', x: 8, y: 1 }
    ],
    exits: {},
    isInterior: true
  },
  Map082: {
    nombre: 'Gimnasio Desayuno',
    npcs: [
      {
        nombre: 'ETHAN',
        sprite: 'char_ 01_a',
        posicion: { x: 18, y: 15 },
        direccion: 2,
        isLeader: true,
        gymId: 'desayuno'
      }
    ],
    buildings: [],
    exits: {
      down: { targetMap: 'Map008', spawn: { x: 15, y: 8 } }
    },
    isInterior: true
  },
  Map005: {
    nombre: 'Gimnasio',
    npcs: [
      {
        nombre: 'LYRA',
        sprite: 'char_ 01_b',
        posicion: { x: 4, y: 1 },
        direccion: 0,
        isLeader: true,
        gymId: 'vestirse'
      }
    ],
    buildings: [],
    exits: {
      down: { targetMap: 'Map002', spawn: { x: 8, y: 6 } }
    },
    isInterior: true
  },
  Map084: {
    nombre: 'Gimnasio Tarde',
    npcs: [{ nombre: 'MORTY', sprite: 'char_ 01_b', posicion: { x: 4, y: 1 }, direccion: 0, isLeader: true, gymId: 'tarde' }],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 25, y: 6 } } },
    isInterior: true
  },
  Map085: {
    nombre: 'Gimnasio Mañana',
    npcs: [{ nombre: 'CLAIR', sprite: 'char_ 01_a', posicion: { x: 4, y: 1 }, direccion: 0, isLeader: true, gymId: 'higiene' }],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 16, y: 6 } } },
    isInterior: true
  },
  Map086: {
    nombre: 'Gimnasio Noche',
    exits: { down: { targetMap: 'Map070', spawn: { x: 5, y: 21 } } },
    isInterior: true
  },
  Map006: {
    nombre: 'Gimnasio Orden',
    npcs: [{ nombre: 'MORTY', sprite: 'char_ 01_b', posicion: { x: 4, y: 1 }, direccion: 0, isLeader: true, gymId: 'orden' }],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 13, y: 16 } } },
    isInterior: true
  }
};

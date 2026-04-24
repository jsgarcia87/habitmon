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
      { type: 'home', nombre: 'HOGAR', x: 15, y: 7, label: { x: 15, y: 5 }, targetMapId: 'house_1', spawn: { x: 9, y: 9 } },
      { type: 'gym', gymId: 'vestirse', nombre: 'VESTIMENTA', x: 8, y: 5, label: { x: 8, y: 3 }, targetMapId: 'Map015', spawn: { x: 9, y: 12 } },
      { type: 'gym', gymId: 'orden', nombre: 'ORDEN', x: 13, y: 15, label: { x: 13, y: 13 }, targetMapId: 'Map007', spawn: { x: 9, y: 12 } },
      { type: 'gym', gymId: 'higiene', nombre: 'HIGIENE', x: 5, y: 13, label: { x: 5, y: 11 }, targetMapId: 'Map046', spawn: { x: 9, y: 12 } }
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
      { type: 'gym', gymId: 'desayuno', nombre: 'DESAYUNO', x: 15, y: 7, label: { x: 15, y: 5 }, targetMapId: 'Map005', spawn: { x: 9, y: 12 } }
    ],
    exits: {
      right: { targetMap: 'Map002', spawn: { x: 1, y: 11 } },
      left: { targetMap: 'Map070', spawn: { x: 34, y: 13 } },
      up: { targetMap: 'Map010', spawn: { x: 22, y: 35 } }
    },
    isInterior: false
  },
  Map070: {
    nombre: 'CIUDAD FRONSAF',
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
      { type: 'gym', gymId: 'higiene', nombre: 'Higiene', x: 16, y: 5, label: { x: 16, y: 3 }, targetMapId: 'Map046', spawn: { x: 9, y: 12 } },
      { type: 'gym', gymId: 'orden', nombre: 'Orden', x: 25, y: 5, label: { x: 25, y: 3 }, targetMapId: 'Map007', spawn: { x: 9, y: 12 } },
      { type: 'gym', gymId: 'comida', nombre: 'Comida', x: 21, y: 13, label: { x: 21, y: 11 }, targetMapId: 'Map016', spawn: { x: 9, y: 12 } },
      { type: 'gym', gymId: 'cena', nombre: 'Cena', x: 5, y: 20, label: { x: 5, y: 18 }, targetMapId: 'Map064', spawn: { x: 9, y: 12 } } 
    ],
    exits: {
      right: { targetMap: 'Map008', spawn: { x: 1, y: 13 } },
      up: { targetMap: 'Map010', spawn: { x: 12, y: 18 } }
    },
    isInterior: false
  },
  Map015: {
    nombre: 'Gimnasio Vestirse',
    npcs: [
      { 
        nombre: 'LYRA', 
        sprite: 'char_ 01_b', 
        posicion: { x: 11, y: 4 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'vestirse',
        mensajes: ['¡Hola! Soy LYRA.', 'Para salir a la aventura hay que ir bien vestido.', '¡Enséñame tu estilo en combate!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map002', spawn: { x: 8, y: 6 } } },
    isInterior: true
  },
  Map046: {
    nombre: 'Gimnasio Higiene',
    npcs: [
      { 
        nombre: 'CLAIR', 
        sprite: 'char_ 11_a', 
        posicion: { x: 13, y: 5 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'higiene',
        mensajes: ['Soy el líder CLAIR.', 'La limpieza es fundamental para un gran entrenador.', '¡Lávate los dientes y prepárate para morder el polvo!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 16, y: 6 } } },
    isInterior: true
  },
  Map007: {
    nombre: 'Gimnasio Orden',
    npcs: [
      { 
        nombre: 'MORTY', 
        sprite: 'char_ 35_a', 
        posicion: { x: 10, y: 3 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'orden',
        mensajes: ['Soy MORTY. En este gimnasio apreciamos el silencio y el ORDEN.', '¿Están tus juguetes recogidos?', '¡Veamos si tu vida está tan bien organizada como mi equipo!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 25, y: 6 } } },
    isInterior: true
  },
  Map005: {
    nombre: 'Gimnasio Desayuno',
    npcs: [
      {
        nombre: 'ETHAN',
        sprite: 'char_ 02_a',
        posicion: { x: 7, y: 2 },
        direccion: 0,
        isLeader: true,
        gymId: 'desayuno',
        mensajes: ['¡Buenísimos días! Soy ETHAN.', '¿Te has comido ya tus cereales?', '¡Demuestra tu energía ganándome en el desayuno!']
      }
    ],
    buildings: [],
    exits: {
      down: { targetMap: 'Map008', spawn: { x: 15, y: 8 } }
    },
    isInterior: true
  },
  Map016: {
    nombre: 'Gimnasio Comida',
    npcs: [
      { 
        nombre: 'CHUCK', 
        sprite: 'char_ 01_a', 
        posicion: { x: 11, y: 4 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'comida',
        mensajes: ['¡GUAAAH! ¡Soy CHUCK!', '¡Una buena comida te da la fuerza para mover rocas!', '¡Acepta mi desafío de mediodía!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 21, y: 14 } } },
    isInterior: true
  },
  Map064: {
    nombre: 'Gimnasio Cena',
    npcs: [
      { 
        nombre: 'PRYCE', 
        sprite: 'char_ 35_a', 
        posicion: { x: 11, y: 4 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'cena',
        mensajes: ['Soy PRYCE. La noche es fría, pero una buena cena calienta el alma.', '¿Has terminado ya tus tareas del día?', '¡Acabemos esto para que puedas irte a dormir!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 5, y: 21 } } },
    isInterior: true
  },
  Map004: {
    nombre: 'Gimnasio Noche',
    npcs: [
      { 
        nombre: 'LORD TRASNOCHO', 
        sprite: 'char_ 35_a', 
        posicion: { x: 7, y: 4 }, 
        direccion: 0, 
        isLeader: true, 
        gymId: 'gym_noche',
        mensajes: ['¡HAS LLEGADO AL FINAL!', 'Soy LORD TRASNOCHO.', 'Sólo los que cumplen sus hábitos nocturnos pueden vencerme.']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 5, y: 21 } } },
    isInterior: true
  }
};

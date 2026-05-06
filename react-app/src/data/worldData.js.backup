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
      left: { targetMap: 'Map029', spawn: { x: 18, y: 12 } }
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
      right: { targetMap: 'Map008', spawn: { x: 1, y: 13 } }
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
  },
  Map038: {
    nombre: 'RUTA 30',
    npcs: [
      {
        nombre: 'Sr. Pokémon',
        sprite: 'char_ 02_a',
        posicion: { x: 15, y: 5 },
        direccion: 2,
        mensajes: ['¡Hola! Soy el Sr. Pokémon.', 'Me encanta coleccionar datos sobre hábitos.', '¿Sabías que leer 15 minutos al día mejora tu EXP de entrenador?']
      },
      {
        nombre: 'Joven Chano',
        sprite: 'char_ 01_a',
        posicion: { x: 10, y: 15 },
        direccion: 1,
        mensajes: ['¡Mira mis shorts! Son cómodos y fáciles de llevar.', '¡Y me ayudan a correr para cumplir mis tareas a tiempo!']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'Casa Sr. P', x: 15, y: 4, label: { x: 15, y: 2 }, targetMapId: 'house_pokemon', spawn: { x: 9, y: 9 } }
    ],
    exits: {
      down: { targetMap: 'Map029', spawn: { x: 20, y: 1 } },
      up: { targetMap: 'Map040', spawn: { x: 15, y: 28 } }
    },
    isInterior: false
  },
  Map040: {
    nombre: 'RUTA 31',
    npcs: [
      {
        nombre: 'Montañero',
        sprite: 'char_ 35_a',
        posicion: { x: 25, y: 10 },
        direccion: 3,
        mensajes: ['Esa de ahí es la Cueva Oscura.', 'Necesitas el hábito de "Valentía" para entrar... ¡o una linterna!']
      }
    ],
    buildings: [],
    exits: {
      down: { targetMap: 'Map038', spawn: { x: 15, y: 6 } },
      left: { targetMap: 'Map078', spawn: { x: 26, y: 15 } }
    },
    isInterior: false
  },
  Map078: {
    nombre: 'CIUDAD MALVA',
    npcs: [
      {
        nombre: 'Anciano Torre',
        sprite: 'char_ 35_a',
        posicion: { x: 20, y: 10 },
        direccion: 2,
        mensajes: ['Bienvenido a Ciudad Malva.', 'Nuestra ciudad es famosa por la Torre Bellsprout.', 'Allí los monjes entrenan el hábito de la Concentración.']
      }
    ],
    buildings: [
      { type: 'gym', gymId: 'orden', nombre: 'Torre Bellsprout', x: 25, y: 5, label: { x: 25, y: 3 }, targetMapId: 'Map007', spawn: { x: 9, y: 12 } },
      { type: 'home', nombre: 'Centro Pokémon', x: 15, y: 15, label: { x: 15, y: 13 }, targetMapId: 'house_1', spawn: { x: 9, y: 9 } }
    ],
    exits: {
      right: { targetMap: 'Map040', spawn: { x: 1, y: 35 } },
      down: { targetMap: 'Map013', spawn: { x: 15, y: 1 } }
    },
    isInterior: false
  },
  Map029: {
    nombre: 'PUEBLO GANYMAHO',
    npcs: [
      {
        nombre: 'Guía Abuelo',
        sprite: 'char_ 35_a',
        posicion: { x: 18, y: 12 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido a Ganymaho Town.', 'Un hermoso pueblo de paso para entrenadores de hábitos.', 'Aquí tenemos un Centro Pokémon para descansar y una Tienda.']
      },
      {
        nombre: 'Deportista',
        sprite: 'char_ 01_a',
        posicion: { x: 25, y: 15 },
        direccion: 1,
        mensajes: ['¡Correr por el pueblo por la mañana es el mejor hábito de cardio!']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'Centro Pokémon', x: 29, y: 12, label: { x: 29, y: 10 }, targetMapId: 'Map031', spawn: { x: 9, y: 9 } },
      { type: 'home', nombre: 'Tienda de Ganymaho', x: 23, y: 12, label: { x: 23, y: 10 }, targetMapId: 'Map032', spawn: { x: 9, y: 9 } }
    ],
    exits: {
      right: { targetMap: 'Map008', spawn: { x: 1, y: 11 } },
      up: { targetMap: 'Map038', spawn: { x: 48, y: 24 } }
    },
    isInterior: false
  },
  Map031: {
    nombre: 'Centro Pokémon de Ganymaho',
    npcs: [
      {
        nombre: 'Enfermera Joy',
        sprite: 'char_ 11_a',
        posicion: { x: 10, y: 4 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido al Centro Pokémon de Ganymaho.', '¿Estás cansado de tanto caminar?', '¡Tus hábitos están a salvo aquí con nosotros!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map029', spawn: { x: 29, y: 13 } } },
    isInterior: true
  },
  Map032: {
    nombre: 'Tienda de Ganymaho',
    npcs: [
      {
        nombre: 'Dependiente',
        sprite: 'char_ 02_a',
        posicion: { x: 5, y: 5 },
        direccion: 2,
        mensajes: ['¡Hola! Vendemos suministros especiales para deportistas activos.', '¡Mantente firme en tus tareas diarias para brillar en combate!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map029', spawn: { x: 23, y: 13 } } },
    isInterior: true
  },
  house_1: {
    nombre: 'Hogar - Planta Baja',
    npcs: [
      {
        nombre: 'Madre',
        sprite: 'char_ 11_a',
        posicion: { x: 13, y: 6 },
        direccion: 0,
        mensajes: ['¡Pórtate bien, hijo! Cumple tus hábitos para ganar medallas.', 'Recuerda que en el ORDENADOR de casa puedes ver tus LOGROS pulsando A.']
      }
    ],
    buildings: [],
    exits: { 
      down: { targetMap: 'Map002', spawn: { x: 15, y: 8 } },
      up: { targetMap: 'house_2', spawn: { x: 10, y: 4 } }
    },
    isInterior: true
  },
  house_2: {
    nombre: 'Hogar - Habitación',
    npcs: [
      {
        nombre: 'Ordenador',
        sprite: null,
        posicion: { x: 7, y: 4 },
        mensajes: ['Es tu ordenador personal. ¡Aquí puedes revisar tus hábitos pendientes!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'house_1', spawn: { x: 13, y: 4 } } },
    isInterior: true
  },
  house_pokemon: {
    nombre: 'Casa del Sr. Pokémon',
    npcs: [
      {
        nombre: 'Sr. Pokémon',
        sprite: 'char_ 02_a',
        posicion: { x: 10, y: 5 },
        direccion: 2,
        mensajes: ['¡Oh! ¡Un joven entrenador!', 'Tengo algo muy especial para ti... ¡un Huevo de Hábito!', 'Cuídalo cumpliendo tus tareas diarias.']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map038', spawn: { x: 15, y: 5 } } },
    isInterior: true
  },
  Map010: {
    nombre: 'CIUDAD TRIGAL',
    npcs: [
      {
        nombre: 'Ciudadano',
        sprite: 'char_ 02_b',
        posicion: { x: 20, y: 15 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido a Ciudad Trigal (Goldenrod City).', '¡Es la metrópolis más bulliciosa de todo Johto!']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'Centro Pokémon', x: 16, y: 27, label: { x: 16, y: 25 }, targetMapId: 'Map011', spawn: { x: 12, y: 20 } },
      { type: 'gym', gymId: 'orden', nombre: 'Gimnasio Trigal', x: 26, y: 7, label: { x: 26, y: 5 }, targetMapId: 'Map012', spawn: { x: 10, y: 19 } }
    ],
    exits: {
      down: { targetMap: 'Map008', spawn: { x: 8, y: 1 } }
    },
    isInterior: false
  },
  Map011: {
    nombre: 'Centro Pokémon de Trigal',
    npcs: [
      {
        nombre: 'Enfermera Joy',
        sprite: 'char_ 11_a',
        posicion: { x: 13, y: 11 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido al Centro Pokémon de Ciudad Trigal.', '¿Quieres que curemos a tus Habitmon cansados?', '¡Cuídate mucho!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map010', spawn: { x: 16, y: 28 } } },
    isInterior: true
  },
  Map012: {
    nombre: 'Gimnasio Trigal',
    npcs: [
      {
        nombre: 'Líder Blanca',
        sprite: 'char_ 00_a',
        posicion: { x: 11, y: 6 },
        direccion: 2,
        mensajes: ['¡Hola! Soy Blanca, la líder del Gimnasio Trigal.', 'Aquí ponemos a prueba tu orden y constancia.', '¿Estás preparado para luchar por tu medalla de hoy?']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map010', spawn: { x: 26, y: 8 } } },
    isInterior: true
  }
};

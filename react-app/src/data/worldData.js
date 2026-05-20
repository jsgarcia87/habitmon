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
      { type: 'home', nombre: 'HOGAR', x: 15, y: 7, label: { x: 15, y: 5 }, targetMapId: 'Map003', spawn: { x: 12, y: 11 } },
      { type: 'gym', gymId: 'vestirse', nombre: 'VESTIMENTA', x: 8, y: 5, label: { x: 8, y: 3 }, targetMapId: 'Map015', spawn: { x: 9, y: 11 } },
      { type: 'gym', gymId: 'orden', nombre: 'ORDEN', x: 13, y: 15, label: { x: 13, y: 13 }, targetMapId: 'Map007', spawn: { x: 8, y: 11 } },
      { type: 'gym', gymId: 'higiene', nombre: 'HIGIENE', x: 5, y: 13, label: { x: 5, y: 11 }, targetMapId: 'Map046', spawn: { x: 8, y: 11 } }
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
      { type: 'gym', gymId: 'desayuno', nombre: 'DESAYUNO', x: 15, y: 7, label: { x: 15, y: 5 }, targetMapId: 'Map005', spawn: { x: 9, y: 11 } }
    ],
    exits: {
      right: { targetMap: 'Map002', spawn: { x: 1, y: 11 } },
      left:  { targetMap: 'Map029', spawn: { x: 18, y: 12 } },
      up:    { targetMap: 'Map010', spawn: { x: 8, y: 34 } }
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
      { type: 'gym', gymId: 'higiene', nombre: 'Higiene', x: 16, y: 22, label: { x: 16, y: 20 }, targetMapId: 'Map046', spawn: { x: 9, y: 11 } },
      { type: 'gym', gymId: 'comida', nombre: 'Comida', x: 17, y: 13, label: { x: 17, y: 11 }, targetMapId: 'Map016', spawn: { x: 9, y: 11 } }
    ],
    exits: {
      right: { targetMap: 'Map008', spawn: { x: 1, y: 13 } }
    },
    isInterior: false
  },
  Map015: {
    nombre: 'Edificio Trigal A',
    npcs: [
      {
        nombre: 'Empleado',
        sprite: 'char_ 02_a',
        posicion: { x: 11, y: 4 },
        direccion: 0,
        mensajes: ['¡Bienvenido al Edificio A de Ciudad Trigal!', 'En las plantas superiores encontrarás más tiendas.']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map010', spawn: { x: 11, y: 6 } } },
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
    exits: { down: { targetMap: 'Map044', spawn: { x: 22, y: 8 } } },
    isInterior: true
  },
  Map007: {
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
  Map005: {
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
    exits: { down: { targetMap: 'Map002', spawn: { x: 13, y: 16 } } },
    isInterior: true
  },
  Map006: {
    nombre: 'Gimnasio Higiene',
    npcs: [
      {
        nombre: 'CLAIR',
        sprite: 'char_ 11_a',
        posicion: { x: 13, y: 5 },
        direccion: 0,
        isLeader: true,
        gymId: 'higiene',
        mensajes: ['Soy CLAIR.', 'La limpieza es fundamental para un gran entrenador.', '¡Lávate los dientes y prepárate para morder el polvo!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map002', spawn: { x: 5, y: 14 } } },
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
    exits: { down: { targetMap: 'Map010', spawn: { x: 13, y: 30 } } },
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
    exits: { down: { targetMap: 'Map003', spawn: { x: 13, y: 5 } } },
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
      { type: 'home', nombre: 'Casa Sr. P', x: 56, y: 11, label: { x: 56, y: 9 }, targetMapId: 'Map039', spawn: { x: 21, y: 15 } }
    ],
    exits: {
      left: { targetMap: 'Map029', spawn: { x: 17, y: 13 } },
      down: { targetMap: 'Map040', spawn: { x: 14, y: 0 } }
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
      up:   { targetMap: 'Map038', spawn: { x: 46, y: 24 } },
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
      { type: 'gym', gymId: 'orden', nombre: 'Torre Bellsprout', x: 15, y: 5, label: { x: 15, y: 3 }, targetMapId: 'Map007', spawn: { x: 9, y: 11 } },
      { type: 'home', nombre: 'Centro Pokémon', x: 7, y: 11, label: { x: 7, y: 9 }, targetMapId: 'Map079', spawn: { x: 9, y: 11 } },
      { type: 'home', nombre: 'Tienda de Malva', x: 23, y: 11, label: { x: 23, y: 9 }, targetMapId: 'Map080', spawn: { x: 9, y: 11 } }
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
        posicion: { x: 10, y: 19 },
        direccion: 1,
        mensajes: ['¡Correr por el pueblo por la mañana es el mejor hábito de cardio!']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'CENTRO POKÉMON', x: 15, y: 17, label: { x: 15, y: 15 }, targetMapId: 'Map031', spawn: { x: 10, y: 10 } },
      { type: 'home', nombre: 'TIENDA', x: 11, y: 11, label: { x: 11, y: 9 }, targetMapId: 'Map032', spawn: { x: 9, y: 10 } }
    ],
    exits: {
      right: { targetMap: 'Map038', spawn: { x: 0, y: 12 } },
      left:  { targetMap: 'Map008', spawn: { x: 39, y: 12 } }
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
    exits: { down: { targetMap: 'Map029', spawn: { x: 15, y: 18 } } },
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
    exits: { down: { targetMap: 'Map029', spawn: { x: 11, y: 12 } } },
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
    exits: { down: { targetMap: 'Map038', spawn: { x: 56, y: 12 } } },
    isInterior: true
  },
  Map003: {
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
      up:   { targetMap: 'Map004', spawn: { x: 10, y: 4 } }
    },
    isInterior: true
  },
  Map009: {
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
    exits: { down: { targetMap: 'Map008', spawn: { x: 15, y: 8 } } },
    isInterior: true
  },
  Map039: {
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
    exits: { down: { targetMap: 'Map038', spawn: { x: 56, y: 12 } } },
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
      { type: 'home', nombre: 'CENTRO POKÉMON', x: 16, y: 27, label: { x: 16, y: 25 }, targetMapId: 'Map011', spawn: { x: 10, y: 10 } },
      { type: 'home', nombre: 'TIENDA', x: 26, y: 27, label: { x: 26, y: 25 }, targetMapId: 'Map018', spawn: { x: 9, y: 10 } },
      { type: 'gym', gymId: 'orden', nombre: 'Gimnasio Trigal', x: 26, y: 7, label: { x: 26, y: 5 }, targetMapId: 'Map007', spawn: { x: 9, y: 11 } }
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
  },
  Map079: {
    nombre: 'Centro Pokémon de Malva',
    npcs: [
      {
        nombre: 'Enfermera Joy',
        sprite: 'char_ 11_a',
        posicion: { x: 9, y: 5 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido al Centro Pokémon de Ciudad Malva.', 'Curamos a tus Habitmon cansados para que sigas superando tus hábitos con energía.', '¡Cuídate mucho!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map078', spawn: { x: 7, y: 12 } } },
    isInterior: true
  },
  Map080: {
    nombre: 'Tienda de Ciudad Malva',
    npcs: [
      {
        nombre: 'Dependiente',
        sprite: 'char_ 02_a',
        posicion: { x: 7, y: 7 },
        direccion: 2,
        mensajes: ['¡Hola! Bienvenido a la Tienda de Ciudad Malva.', 'Aquí puedes adquirir pociones de enfoque y vitaminas de autodisciplina.', '¡Mantente firme en tus tareas diarias para brillar en combate!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map078', spawn: { x: 23, y: 12 } } },
    isInterior: true
  },
  Map083: {
    nombre: 'Torre Bellsprout',
    npcs: [
      {
        nombre: 'Monje Sabio',
        sprite: 'char_ 35_a',
        posicion: { x: 9, y: 4 },
        direccion: 0,
        isLeader: true,
        gymId: 'orden',
        mensajes: ['Soy el guardián de la Torre Bellsprout.', 'El ORDEN y la disciplina son el camino del verdadero entrenador.', '¡Demuéstrame que puedes mantener el orden en tu vida!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map078', spawn: { x: 15, y: 6 } } },
    isInterior: true
  },
  Map067: {
    nombre: 'Gimnasio Higiene de Fronsaf',
    npcs: [
      {
        nombre: 'CLAIR',
        sprite: 'char_ 11_a',
        posicion: { x: 14, y: 5 },
        direccion: 0,
        isLeader: true,
        gymId: 'higiene',
        mensajes: ['Soy CLAIR.', 'La limpieza no es opcional, es la base de todo.', '¡Demuéstrame que te lavas los dientes cada día!']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map070', spawn: { x: 16, y: 23 } } },
    isInterior: true
  },
  Map026: {
    nombre: 'Pasaje Subterráneo',
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
    exits: { down: { targetMap: 'Map070', spawn: { x: 17, y: 14 } } },
    isInterior: true
  },
  Map013: {
    nombre: 'RUTA 32',
    npcs: [
      {
        nombre: 'Pescador',
        sprite: 'char_ 01_a',
        posicion: { x: 10, y: 10 },
        direccion: 2,
        mensajes: ['¡Paciencia y constancia! Eso es lo que enseña la pesca.', 'Como un buen hábito, los peces no pican si no esperas.']
      }
    ],
    buildings: [],
    exits: {
      up: { targetMap: 'Map078', spawn: { x: 15, y: 26 } }
    },
    isInterior: false
  },
  Map018: {
    nombre: 'C.C. Trigal - 1F',
    npcs: [
      {
        nombre: 'Recepcionista',
        sprite: 'char_ 11_a',
        posicion: { x: 16, y: 5 },
        direccion: 2,
        mensajes: ['¡Bienvenido al Centro Comercial de Ciudad Trigal!', 'En cada planta encontrarás diferentes tiendas y entrenadores de hábitos.']
      }
    ],
    buildings: [],
    exits: { down: { targetMap: 'Map010', spawn: { x: 26, y: 28 } } },
    isInterior: true
  }
};

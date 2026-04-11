export const WORLDS = [
  // ── MAÑANA ─────────────────────────────────
  {
    world_id: 'habitacion',
    nombre: 'Tu Habitación',
    tiempo: 'morning',
    orden: 1,
    mapId: 'Map003',
    tileset: 'gsc house 1',
    musica: 'Audio/BGM/pokemon_center.mid',
    posicion_inicial: { x: 8, y: 10 },
    gym_id: 'vestirse',
    gym_position: { x: 8, y: 4 },
    npcs: [
      {
        nombre: 'Mamá',
        sprite: 'mom-johto',
        posicion: { x: 5, y: 8 },
        direccion: 2,
        mensajes: [
          '¡Buenos días, campeón!',
          'Antes de salir de aventura...',
          '¡Tienes que vestirte!',
          'Ve al gimnasio y demuestra lo que vales.'
        ],
        pista_habito: true
      },
      {
        nombre: 'Espejo',
        sprite: null,
        posicion: { x: 11, y: 6 },
        mensajes: [
          '(Te miras en el espejo...)',
          '¡Todavía tienes el pijama puesto!',
          'Será mejor que te vistas.'
        ]
      }
    ]
  },
  {
    world_id: 'bano',
    nombre: 'El Baño',
    tiempo: 'morning',
    orden: 2,
    mapId: 'Map004',
    tileset: 'gsc checkpoint b',
    posicion_inicial: { x: 6, y: 8 },
    gym_id: 'higiene_m',
    gym_position: { x: 6, y: 3 },
    npcs: [
      {
        nombre: 'Reflejo',
        sprite: null,
        posicion: { x: 6, y: 5 },
        mensajes: [
          '(Te miras en el espejo del baño...)',
          'Tienes cara de sueño todavía.',
          '¡Lávate la cara y los dientes!',
          'El líder del gimnasio te está esperando.'
        ],
        pista_habito: true
      },
      {
        nombre: 'Cepillo',
        sprite: null,
        posicion: { x: 8, y: 5 },
        mensajes: [
          '(Un cepillo de dientes reluciente...)',
          '¡Úsame! ¡Úsame!',
          'Los dientes brillantes dan el +10% de daño.'
        ]
      }
    ]
  },
  {
    world_id: 'cocina',
    nombre: 'La Cocina',
    tiempo: 'morning',
    orden: 3,
    mapId: 'Map005',
    tileset: 'gsc house 2',
    posicion_inicial: { x: 7, y: 9 },
    gym_id: 'desayuno',
    gym_position: { x: 7, y: 4 },
    npcs: [
      {
        nombre: 'Abuela',
        sprite: 'mom-kanto-gsc',
        posicion: { x: 5, y: 6 },
        mensajes: [
          '¡El desayuno está listo!',
          'Un campeón necesita energía.',
          'Come bien antes de entrenar.',
          'El gimnasio del desayuno te espera al fondo.'
        ],
        pista_habito: true
      },
      {
        nombre: 'Nevera',
        sprite: null,
        posicion: { x: 10, y: 5 },
        mensajes: [
          '(La nevera está llena de cosas ricas...)',
          'La leche y la fruta te darán fuerza.',
          '¡No te vayas sin desayunar!'
        ]
      }
    ]
  },
  // ── TARDE ──────────────────────────────────
  {
    world_id: 'colegio',
    nombre: 'El Colegio',
    tiempo: 'day',
    orden: 4,
    mapId: 'Map010',
    tileset: 'gsc lab-gym',
    posicion_inicial: { x: 9, y: 12 },
    gym_id: 'deberes',
    gym_position: { x: 9, y: 4 },
    npcs: [
      {
        nombre: 'Profesor',
        sprite: 'prof_oak',
        posicion: { x: 7, y: 7 },
        mensajes: [
          'Bienvenido al Colegio.',
          'Hoy tenemos deberes importantes.',
          'Quien complete sus tareas...',
          '¡Podrá capturar un Pokémon especial!',
          'Ve al aula del fondo.'
        ],
        pista_habito: true
      },
      {
        nombre: 'Compañero',
        sprite: 'trchar001',
        posicion: { x: 11, y: 9 },
        mensajes: [
          'Hey! ¿Ya hiciste los deberes?',
          'Yo tardé mucho pero lo conseguí.',
          '¡El Pokémon que me dieron es genial!'
        ]
      }
    ]
  },
  {
    world_id: 'parque',
    nombre: 'El Parque',
    tiempo: 'day',
    orden: 5,
    mapId: 'Map011',
    tileset: 'gsc national park day',
    posicion_inicial: { x: 10, y: 14 },
    gym_id: 'merienda',
    gym_position: { x: 10, y: 6 },
    npcs: [
      {
        nombre: 'Amigo',
        sprite: 'trchar002',
        posicion: { x: 8, y: 10 },
        mensajes: [
          '¡Hola! ¿Vienes al parque?',
          'Primero tienes que merendar.',
          'Una manzana o un bocadillo.',
          '¡Con energía se entrena mejor!'
        ],
        pista_habito: true
      }
    ]
  },
  {
    world_id: 'salon',
    nombre: 'El Salón',
    tiempo: 'day',
    orden: 6,
    mapId: 'Map012',
    tileset: 'gsc house 3',
    posicion_inicial: { x: 8, y: 10 },
    gym_id: 'orden',
    gym_position: { x: 8, y: 4 },
    npcs: [
      {
        nombre: 'Papá',
        sprite: 'trchar003',
        posicion: { x: 6, y: 7 },
        mensajes: [
          'La habitación está hecha un desastre.',
          'Un buen entrenador tiene orden.',
          'Recoge todo antes de entrenar.',
          '¡El gimnasio del orden te espera!'
        ],
        pista_habito: true
      }
    ]
  },
  // ── NOCHE ──────────────────────────────────
  {
    world_id: 'bano_noche',
    nombre: 'El Baño (Noche)',
    tiempo: 'night',
    orden: 7,
    mapId: 'Map020',
    tileset: 'gsc checkpoint b',
    overlay: 'rgba(0,0,30,0.3)',
    posicion_inicial: { x: 6, y: 8 },
    gym_id: 'ducha',
    gym_position: { x: 6, y: 3 },
    npcs: [
      {
        nombre: 'Mamá',
        sprite: 'mom-johto',
        posicion: { x: 4, y: 6 },
        mensajes: [
          'Ya es hora de la ducha.',
          'Los campeones siempre están limpios.',
          '¡Date prisa o te quedas sin cuento!'
        ],
        pista_habito: true
      }
    ]
  },
  {
    world_id: 'comedor_noche',
    nombre: 'El Comedor',
    tiempo: 'night',
    orden: 8,
    mapId: 'Map021',
    tileset: 'gsc house 2',
    overlay: 'rgba(0,0,30,0.2)',
    posicion_inicial: { x: 7, y: 9 },
    gym_id: 'cena',
    gym_position: { x: 7, y: 4 },
    npcs: [
      {
        nombre: 'Abuela',
        sprite: 'mom-kanto-gsc',
        posicion: { x: 5, y: 6 },
        mensajes: [
          '¡La cena está en la mesa!',
          'Come verduras para ser fuerte.',
          'Los Pokémon fuertes comen bien.'
        ],
        pista_habito: true
      }
    ]
  },
  {
    world_id: 'dormitorio',
    nombre: 'Tu Dormitorio',
    tiempo: 'night',
    orden: 9,
    mapId: 'Map022',
    tileset: 'gsc house 1',
    overlay: 'rgba(0,0,40,0.45)',
    posicion_inicial: { x: 8, y: 10 },
    gym_id: 'dormir',
    gym_position: { x: 8, y: 4 },
    npcs: [
      {
        nombre: 'Papá',
        sprite: 'trchar003',
        posicion: { x: 6, y: 7 },
        mensajes: [
          'Es hora de dormir, campeón.',
          'Los grandes entrenadores descansan bien.',
          'Apaga la tablet y métete en cama.',
          'Mañana habrá nuevas aventuras.'
        ],
        pista_habito: true
      },
      {
        nombre: 'Cama',
        sprite: null,
        posicion: { x: 10, y: 5 },
        mensajes: [
          '(Una cama cómoda y acogedora...)',
          'Zzz... te llama...',
          '¡Pero primero el gimnasio!'
        ]
      }
    ]
  },
  // ── EXTERIOR (EL PUEBLO) ──────────────────────
  {
    world_id: 'pueblo_mañana',
    nombre: 'Pueblo Hábito (Mañana)',
    tiempo: 'morning',
    mapId: 'Map001',
    tileset: 'gsc overworld johto morning',
    posicion_inicial: { x: 15, y: 28 },
    gym_id: 'gym_manana',
    gym_position: { x: 15, y: 15 },
    npcs: [
      {
        nombre: 'Guía',
        sprite: 'prof_oak',
        posicion: { x: 17, y: 17 },
        mensajes: ['¡Buenos días! El gimnasio mañanero está justo delante.', '¿Ya desayunaste?']
      }
    ]
  },
  {
    world_id: 'pueblo_tarde',
    nombre: 'Pueblo Hábito (Tarde)',
    tiempo: 'day',
    mapId: 'Map001',
    tileset: 'gsc overworld johto day',
    posicion_inicial: { x: 15, y: 28 },
    gym_id: 'gym_tarde',
    gym_position: { x: 15, y: 15 },
    npcs: [
      {
        nombre: 'Vecino',
        sprite: 'trchar001',
        posicion: { x: 17, y: 17 },
        mensajes: ['¡Qué tarde más buena hace!', 'El gimnasio está muy concurrido hoy.']
      }
    ]
  },
  {
    world_id: 'pueblo_noche',
    nombre: 'Pueblo Hábito (Noche)',
    tiempo: 'night',
    mapId: 'Map001',
    tileset: 'gsc overworld johto nite',
    posicion_inicial: { x: 15, y: 28 },
    gym_id: 'gym_noche',
    gym_position: { x: 15, y: 15 },
    npcs: [
      {
        nombre: 'Sereno',
        sprite: 'nurse_joy',
        posicion: { x: 17, y: 17 },
        mensajes: ['Es tarde, deberías ir a descansar.', 'El gimnasio nocturno es el más difícil.']
      }
    ]
  }
];

/**
 * pokedexData.js
 * Datos enciclopédicos completos para la Pokédex Duo:
 * categorías, alturas, pesos, lore en español y datos de compatibilidad.
 */

export const POKEDEX_ENTRIES = {
  '001': {
    name: 'Bulbasaur',
    category: 'Pokémon Semilla',
    height: '0.7 m',
    weight: '6.9 kg',
    color: '#78C850',
    description: 'Una extraña semilla fue plantada en su lomo al nacer. La planta brota y crece con este Pokémon a medida que absorbe los rayos del sol.'
  },
  '002': {
    name: 'Ivysaur',
    category: 'Pokémon Semilla',
    height: '1.0 m',
    weight: '13.0 kg',
    color: '#78C850',
    description: 'La flor de su lomo va creciendo lentamente. Cuando está a punto de florecer, despide un aroma dulce y delicioso.'
  },
  '003': {
    name: 'Venusaur',
    category: 'Pokémon Semilla',
    height: '2.0 m',
    weight: '100.0 kg',
    color: '#78C850',
    description: 'La enorme flor de su lomo absorbe la luz del sol para transformarla en energía. Llena el aire de un aroma embriagador.'
  },
  '004': {
    name: 'Charmander',
    category: 'Pokémon Lagartija',
    height: '0.6 m',
    weight: '8.5 kg',
    color: '#F08030',
    description: 'La llama que tiene en la punta de la cola arde según sus sentimientos. Llamea suavemente si está alegre y ruge si se enfurece.'
  },
  '005': {
    name: 'Charmeleon',
    category: 'Pokémon Llama',
    height: '1.1 m',
    weight: '19.0 kg',
    color: '#F08030',
    description: 'Es de naturaleza agresiva y busca rivales constantemente. En los combates agita su cola ígnea para intimidar al enemigo.'
  },
  '006': {
    name: 'Charizard',
    category: 'Pokémon Llama',
    height: '1.7 m',
    weight: '90.5 kg',
    color: '#F08030',
    description: 'Lanza llamas tan calientes que pueden fundir las rocas más duras. Vuela por los cielos buscando rivales a su altura.'
  },
  '007': {
    name: 'Squirtle',
    category: 'Pokémon Tortuguita',
    height: '0.5 m',
    weight: '9.0 kg',
    color: '#6890F0',
    description: 'Cuando se siente amenazado, repliega las extremidades dentro de su resistente caparazón y dispara agua a presión.'
  },
  '008': {
    name: 'Wartortle',
    category: 'Pokémon Tortuga',
    height: '1.0 m',
    weight: '22.5 kg',
    color: '#6890F0',
    description: 'Su cola esponjosa es símbolo de longevidad. La mueve rítmicamente para mantener el equilibrio al nadar a toda velocidad.'
  },
  '009': {
    name: 'Blastoise',
    category: 'Pokémon Marisco',
    height: '1.6 m',
    weight: '85.5 kg',
    color: '#6890F0',
    description: 'Dispara potentes chorros de agua por los dos cañones de acero de su caparazón con la fuerza suficiente para quebrar gruesos muros.'
  },
  '010': {
    name: 'Caterpie',
    category: 'Pokémon Gusano',
    height: '0.3 m',
    weight: '2.9 kg',
    color: '#A8B820',
    description: 'Para protegerse despide un hedor terrible por sus antenas rojas en forma de Y, alejando a las aves y depredadores.'
  },
  '011': {
    name: 'Metapod',
    category: 'Pokémon Capullo',
    height: '0.7 m',
    weight: '9.9 kg',
    color: '#A8B820',
    description: 'Su cuerpo se encuentra encerrado en una coraza dura como el acero. Permanece inmóvil mientras prepara su evolución interna.'
  },
  '012': {
    name: 'Butterfree',
    category: 'Pokémon Mariposa',
    height: '1.1 m',
    weight: '32.0 kg',
    color: '#A8B820',
    description: 'Revolotea de flor en flor en busca de polen. Sus alas desprenden un polvo venenoso que repele los ataques de los enemigos.'
  },
  '016': {
    name: 'Pidgey',
    category: 'Pokémon Pajarito',
    height: '0.3 m',
    weight: '1.8 kg',
    color: '#A8A878',
    description: 'Muy dócil y pacífico. Si es atacado, levanta una nube de arena con las alas para escapar antes que entrar en combate.'
  },
  '017': {
    name: 'Pidgeotto',
    category: 'Pokémon Pájaro',
    height: '1.1 m',
    weight: '30.0 kg',
    color: '#A8A878',
    description: 'Vuela en amplios círculos vigilando su territorio. Sus afiladas garras apresan con fuerza a cualquier presa que descubra.'
  },
  '018': {
    name: 'Pidgeot',
    category: 'Pokémon Pájaro',
    height: '1.5 m',
    weight: '39.5 kg',
    color: '#A8A878',
    description: 'Vuela a una velocidad asombrosa de Mach 2. Despliega sus magníficas y hermosas plumas para impresionar a sus rivales.'
  },
  '019': {
    name: 'Rattata',
    category: 'Pokémon Ratón',
    height: '0.3 m',
    weight: '3.5 kg',
    color: '#A8A878',
    description: 'Sus largos y afilados colmillos no dejan de crecer durante toda su vida, por lo que roe superficies duras constantemente.'
  },
  '021': {
    name: 'Spearow',
    category: 'Pokémon Pajarito',
    height: '0.3 m',
    weight: '2.0 kg',
    color: '#A8A878',
    description: 'Tiene un temperamento muy territorial. Agita rápidamente sus pequeñas alas para patrullar y emite chillidos de advertencia.'
  },
  '025': {
    name: 'Pikachu',
    category: 'Pokémon Ratón',
    height: '0.4 m',
    weight: '6.0 kg',
    color: '#F8D030',
    description: 'Almacena electricidad en las bolsas rojas de sus mejillas. Cuando libera la energía acumulada, puede provocar relámpagos.'
  },
  '052': {
    name: 'Meowth',
    category: 'Pokémon Gato',
    height: '0.4 m',
    weight: '4.2 kg',
    color: '#A8A878',
    description: 'Le fascinan los objetos redondos y brillantes, en especial las monedas de oro. Merodea por las calles a altas horas de la noche.'
  },
  '053': {
    name: 'Persian',
    category: 'Pokémon Gato Fino',
    height: '1.0 m',
    weight: '32.0 kg',
    color: '#A8A878',
    description: 'Es célebre por su pelaje suave y su andar refinado, pero se vuelve sumamente feroz si alguien osa tocarle los bigotes.'
  },
  '056': {
    name: 'Mankey',
    category: 'Pokémon Mono Cerdo',
    height: '0.5 m',
    weight: '28.0 kg',
    color: '#C03028',
    description: 'Se enfurece con una facilidad pasmosa. Cuando empieza a bufar y a temblar de ira, desata golpes frenéticos sin control.'
  },
  '063': {
    name: 'Abra',
    category: 'Pokémon Teletransporte',
    height: '0.9 m',
    weight: '19.5 kg',
    color: '#F85888',
    description: 'Duerme unas 18 horas al día. Incluso mientras duerme plácidamente, puede sentir el peligro y teletransportarse a un lugar seguro.'
  },
  '066': {
    name: 'Machop',
    category: 'Pokémon Superpoder',
    height: '0.8 m',
    weight: '19.5 kg',
    color: '#C03028',
    description: 'Su cuerpo está repleto de músculos compactos. Para entrenar su fuerza, levanta y arroja peñascos una y otra vez.'
  },
  '067': {
    name: 'Machoke',
    category: 'Pokémon Superpoder',
    height: '1.5 m',
    weight: '70.5 kg',
    color: '#C03028',
    description: 'Posee una musculatura tan descomunal que necesita portar un cinturón especial de fuerza para contener su poder desbordante.'
  },
  '088': {
    name: 'Grimer',
    category: 'Pokémon Lodo',
    height: '0.9 m',
    weight: '30.0 kg',
    color: '#A040A0',
    description: 'Nacido en residuos tóxicos vertidos en el agua. Se alimenta de desechos industriales y deja un rastro viscoso a su paso.'
  },
  '100': {
    name: 'Voltorb',
    category: 'Pokémon Bola',
    height: '0.5 m',
    weight: '10.4 kg',
    color: '#F8D030',
    description: 'Se parece de forma inquietante a una Poké Ball. Es sumamente inestable y suele estallar al más mínimo roce o sobresalto.'
  },
  '143': {
    name: 'Snorlax',
    category: 'Pokémon Dormilón',
    height: '2.1 m',
    weight: '460.0 kg',
    color: '#A8A878',
    description: 'No se queda satisfecho hasta haber engullido 400 kilos de comida cada día. Una vez saciado, se duerme de inmediato.'
  },
  '152': {
    name: 'Chikorita',
    category: 'Pokémon Hoja',
    height: '0.9 m',
    weight: '6.4 kg',
    color: '#78C850',
    description: 'Agita la agradable hoja de su cabeza para despedir una dulce fragancia que calma las tensiones de quienes están cerca.'
  },
  '153': {
    name: 'Bayleef',
    category: 'Pokémon Hoja',
    height: '1.2 m',
    weight: '15.8 kg',
    color: '#78C850',
    description: 'Las hojas brotadas alrededor de su cuello despiden un aroma vivificante y picante que llena de vigor a sus aliados.'
  },
  '154': {
    name: 'Meganium',
    category: 'Pokémon Hierba',
    height: '1.8 m',
    weight: '100.5 kg',
    color: '#78C850',
    description: 'Su aliento es capaz de revivir plantas marchitas. La fragancia de sus grandes pétalos aplaca la hostilidad en combate.'
  },
  '155': {
    name: 'Cyndaquil',
    category: 'Pokémon Ratón Fuego',
    height: '0.5 m',
    weight: '7.9 kg',
    color: '#F08030',
    description: 'Es de naturaleza asustadiza y tímida. Si se siente en peligro, brotan llamaradas ardientes de los orificios de su lomo.'
  },
  '156': {
    name: 'Quilava',
    category: 'Pokémon Volcán',
    height: '0.9 m',
    weight: '19.0 kg',
    color: '#F08030',
    description: 'Antes de atacar muestra la espalda a su adversario para intimidarlo con el poder y calor de sus ardientes llamaradas.'
  },
  '157': {
    name: 'Typhlosion',
    category: 'Pokémon Volcán',
    height: '1.7 m',
    weight: '79.5 kg',
    color: '#F08030',
    description: 'Si se enfurece al máximo, genera explosiones de fuego devastadoras capaces de calcinar todo lo que esté a su alcance.'
  },
  '158': {
    name: 'Totodile',
    category: 'Pokémon Fauces',
    height: '0.6 m',
    weight: '9.5 kg',
    color: '#6890F0',
    description: 'Tiene unas mandíbulas tan potentes que puede destrozar cualquier objeto. Muerde todo lo que se mueve a modo de saludo.'
  },
  '159': {
    name: 'Croconaw',
    category: 'Pokémon Fauces',
    height: '1.1 m',
    weight: '25.0 kg',
    color: '#6890F0',
    description: 'Sus colmillos apuntan hacia atrás. Una vez que hinca los dientes en su presa, es totalmente imposible hacerle soltar el bocado.'
  },
  '160': {
    name: 'Feraligatr',
    category: 'Pokémon Fauces',
    height: '2.3 m',
    weight: '88.8 kg',
    color: '#6890F0',
    description: 'Abre sus gigantescas fauces para intimidar. En tierra firme se abalanza sobre el rival con una velocidad sorprendente.'
  }
};

export const TYPE_COLORS = {
  NORMAL: { bg: '#A8A878', border: '#6D6D4E' },
  FIRE: { bg: '#F08030', border: '#9C531F' },
  WATER: { bg: '#6890F0', border: '#445E9C' },
  GRASS: { bg: '#78C850', border: '#4E8234' },
  ELECTRIC: { bg: '#F8D030', border: '#A1871F' },
  ICE: { bg: '#98D8D8', border: '#638D8D' },
  FIGHTING: { bg: '#C03028', border: '#7D1F1A' },
  POISON: { bg: '#A040A0', border: '#682A68' },
  GROUND: { bg: '#E0C068', border: '#927D44' },
  FLYING: { bg: '#A890F0', border: '#6D5E9C' },
  PSYCHIC: { bg: '#F85888', border: '#A13959' },
  BUG: { bg: '#A8B820', border: '#6D7815' },
  ROCK: { bg: '#B8A038', border: '#786824' },
  GHOST: { bg: '#705898', border: '#493963' },
  DRAGON: { bg: '#7038F8', border: '#4924A1' },
  STEEL: { bg: '#B8B8D0', border: '#787887' }
};

export const getPokedexData = (speciesId) => {
  const paddedId = String(speciesId).padStart(3, '0');
  return POKEDEX_ENTRIES[paddedId] || {
    name: `Pokémon #${paddedId}`,
    category: 'Pokémon Misterioso',
    height: '??? m',
    weight: '??? kg',
    color: '#6890F0',
    description: 'Datos aún no registrados en la enciclopedia de Habitmon. ¡Continúa tu aventura para descubrirlos!'
  };
};

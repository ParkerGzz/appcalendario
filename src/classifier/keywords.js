/**
 * Keywords Dictionary for Task Classification
 *
 * This file contains all keywords used by TaskClassifier to automatically
 * categorize tasks into fitness, shopping, pharmacy, and general categories.
 *
 * Structure:
 * - Each category maps to an array of keywords
 * - Keywords are lowercase for case-insensitive matching
 * - Keywords can be single words or phrases
 * - More specific keywords should appear after general ones
 *
 * @module classifier/keywords
 */

/**
 * Keywords for fitness-related tasks
 * Includes: gym activities, sports, exercise types, fitness concepts
 *
 * @type {string[]}
 */
const FITNESS_KEYWORDS = [
  // Gym & Fitness Centers
  'gym',
  'gimnasio',
  'fitness',
  'crossfit',
  'spinning',
  'pilates',
  'yoga',

  // Training & Exercise
  'entrenar',
  'entrenamiento',
  'ejercicio',
  'ejercicios',
  'entrenamientos',
  'workout',
  'workouts',

  // Strength Training
  'pesas',
  'musculación',
  'levantamiento',
  'pesas rusas',
  'kettlebell',

  // Cardio & Running
  'cardio',
  'correr',
  'carrera',
  'corrida',
  'running',
  'trotar',
  'trotando',

  // Walking & Hiking
  'caminar',
  'caminata',
  'senderismo',
  'marcha',
  'camino',

  // Water Sports
  'natación',
  'nadar',
  'piscina',
  'agua',

  // Sports
  'tenis',
  'futbol',
  'fútbol',
  'basquetbol',
  'baloncesto',
  'voleibol',
  'badminton',
  'boxeo',
  'lucha',
  'atletismo',

  // Cycling & Outdoor
  'ciclismo',
  'bicicleta',
  'bici',
  'cicla',
  'mountain bike',
  'mtb',
  'skateboard',

  // Mind-Body
  'meditación',
  'meditacion',
  'mindfulness',
  'respiración',
  'respiracion',
  'relajación',
  'relajacion',

  // Stretching & Flexibility
  'estiramientos',
  'estiramiento',
  'flexibilidad',
  'movilidad',

  // Recovery & Health
  'masaje',
  'recuperación',
  'recuperacion',
  'descanso',
  'stretching',
  'foam roller',
  'mobility work',

  // Outdoor Activities
  'escalada',
  'escalador',
  'montaña',
  'montana',
  'trail',
  'patinar',
  'patinaje'
];

/**
 * Keywords for shopping at Líder (Chilean supermarket)
 * Includes: store names, shopping activities, product types
 *
 * @type {string[]}
 */
const SHOPPING_LIDER_KEYWORDS = [
  // Store Names
  'líder',
  'lider',
  'jumbo',
  'carrefour',
  'supermercado',
  'super',
  'tienda',

  // Shopping Activities
  'compras',
  'comprar',
  'ir de compras',
  'hacer compras',
  'shopping',
  'compra',

  // Food & Groceries
  'comida',
  'alimentos',
  'alimento',
  'despensa',
  'abarrotes',
  'abarrote',
  'lista de compras',
  'groceries',
  'grocery',

  // Food Categories
  'pan',
  'leche',
  'queso',
  'verduras',
  'vegetales',
  'fruta',
  'frutas',
  'carnes',
  'carne',
  'pescado',
  'pollo',
  'huevos',
  'arroz',
  'pasta',
  'aceite',
  'mantequilla',
  'yogurt',
  'yoghurt',

  // Shopping Concepts
  'carrito',
  'bolsa',
  'bolsas',
  'lista',
  'presupuesto',
  'oferta',
  'descuento',
  'promoción',
  'promocion',
  'compra semanal',
  'compra mensual',

  // General Errands
  'mandado',
  'mandados',
  'recado',
  'recados',
  'ir al super',
  'comprar comida',
  'comprar alimentos'
];

/**
 * Keywords for pharmacy-related tasks
 * Includes: medications, health products, pharmacy services
 *
 * @type {string[]}
 */
const PHARMACY_KEYWORDS = [
  // Pharmacy Locations & Services
  'farmacia',
  'farmacias',
  'farmacéutico',
  'farmaceutico',
  'droguería',
  'drogeria',

  // General Medications
  'medicina',
  'medicinas',
  'medicamento',
  'medicamentos',
  'remedio',
  'remedios',
  'fármaco',
  'farmaco',

  // Medicine Forms
  'pastilla',
  'pastillas',
  'píldora',
  'pildora',
  'tableta',
  'tabletas',
  'cápsula',
  'capsula',
  'cápsulas',
  'capsulas',
  'jarabe',
  'inyección',
  'inyeccion',
  'crema',
  'ungüento',
  'ungüento',
  'pomada',
  'gotas',
  'gota',

  // Common Over-the-Counter Medications (Chile-specific)
  'ibupirac',
  'ibuprofen',
  'ibuprofeno',
  'tafirol',
  'paracetamol',
  'aspirin',
  'aspirina',
  'dolor',
  'doloroso',
  'dolor de cabeza',
  'cefalea',
  'migraña',
  'migraina',

  // Medication Categories
  'analgésico',
  'analgesico',
  'analgésicos',
  'analgesicos',
  'anti-inflamatorio',
  'antiinflamatorio',
  'antibiótico',
  'antibiotico',
  'antibióticos',
  'antibioticos',
  'vitamina',
  'vitaminas',
  'suplemento',
  'suplementos',
  'probiótico',
  'probiotico',
  'antacido',
  'antácido',

  // Medical Concepts
  'receta',
  'recetas',
  'prescripción',
  'prescripcion',
  'doctor',
  'médico',
  'medico',
  'farmacéutico',
  'farmaceutico',
  'tratamiento',
  'dosis',
  'posología',

  // Health Conditions
  'resfriado',
  'gripe',
  'tos',
  'fiebre',
  'infección',
  'infeccion',
  'alergia',
  'alergias',
  'asma',
  'diabetes',
  'presión',
  'presion',

  // Health Products
  'vendaje',
  'vendajes',
  'gasa',
  'gasas',
  'esparadrapo',
  'termómetro',
  'termometro',
  'alcohol',
  'desinfectante',
  'antiséptico',
  'antiseptico',
  'mascarilla',
  'guantes',
  'suero fisiológico',
  'suero fisiologico'
];

/**
 * Complete keywords dictionary for all categories
 *
 * Usage:
 * ```javascript
 * import { CLASSIFIER_KEYWORDS } from './keywords.js';
 *
 * const fitness = CLASSIFIER_KEYWORDS.fitness;
 * const shopping = CLASSIFIER_KEYWORDS.shopping_lider;
 * const pharmacy = CLASSIFIER_KEYWORDS.pharmacy;
 * ```
 *
 * @type {Object}
 */
const CLASSIFIER_KEYWORDS = {
  fitness: FITNESS_KEYWORDS,
  shopping_lider: SHOPPING_LIDER_KEYWORDS,
  pharmacy: PHARMACY_KEYWORDS
};

/**
 * Category metadata with descriptions and colors
 *
 * Used for UI display, filtering, and categorization hints
 *
 * @type {Object}
 */
const CATEGORY_METADATA = {
  fitness: {
    label: 'Fitness',
    icon: '💪',
    color: '#FF6B6B',
    description: 'Tareas relacionadas con ejercicio y fitness',
    emoji: '🏋️'
  },
  shopping_lider: {
    label: 'Compras Líder',
    icon: '🛒',
    color: '#4ECDC4',
    description: 'Ir de compras al supermercado',
    emoji: '🛍️'
  },
  pharmacy: {
    label: 'Farmacia',
    icon: '💊',
    color: '#95E1D3',
    description: 'Tareas relacionadas con medicinas y farmacia',
    emoji: '🏥'
  },
  general: {
    label: 'General',
    icon: '📝',
    color: '#CCCCCC',
    description: 'Otras tareas',
    emoji: '📋'
  }
};

/**
 * Exclusion words that indicate negation or opposite intent
 *
 * If a task contains these words, it might indicate the opposite category
 * Example: "No ir al gimnasio" (Don't go to the gym) should not be fitness
 *
 * @type {string[]}
 */
const EXCLUSION_WORDS = [
  'no',
  'sin',
  'evitar',
  'nunca',
  'jamás',
  'jamas',
  'no hacer',
  'no ir',
  'no comprar',
  'no tomar'
];

/**
 * Keywords by difficulty level for adaptive filtering
 *
 * Can be used to show only certain keywords based on user preference
 * or confidence threshold
 *
 * @type {Object}
 */
const KEYWORD_DIFFICULTY = {
  // Obvious keywords that are clear indicators
  obvious: [
    'gym',
    'gimnasio',
    'farmacia',
    'medicamento',
    'compras',
    'supermercado'
  ],
  // Common keywords that are good indicators
  common: [
    'entrenar',
    'ejercicio',
    'yoga',
    'natación',
    'correr',
    'remedio',
    'pastilla',
    'carrito',
    'lista de compras'
  ],
  // Ambiguous keywords that need context
  ambiguous: [
    'ir',
    'hacer',
    'actividad',
    'producto',
    'comprar',
    'marcha',
    'ir a'
  ]
};

// Export functions and objects
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLASSIFIER_KEYWORDS,
    FITNESS_KEYWORDS,
    SHOPPING_LIDER_KEYWORDS,
    PHARMACY_KEYWORDS,
    CATEGORY_METADATA,
    EXCLUSION_WORDS,
    KEYWORD_DIFFICULTY
  };
}

// ES6 export (if used in module context)
// export {
//   CLASSIFIER_KEYWORDS,
//   FITNESS_KEYWORDS,
//   SHOPPING_LIDER_KEYWORDS,
//   PHARMACY_KEYWORDS,
//   CATEGORY_METADATA,
//   EXCLUSION_WORDS,
//   KEYWORD_DIFFICULTY
// };

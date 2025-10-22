/**
 * TaskClassifier - Clasificador automático de tareas
 *
 * Utiliza palabras clave para clasificar tareas en categorías
 * (fitness, shopping_lider, pharmacy, general)
 *
 * Importa palabras clave desde keywords.js para mejor mantenibilidad
 *
 * @class TaskClassifier
 */
class TaskClassifier {
  /**
   * Constructor
   *
   * @param {Object} keywordsDictionary - Diccionario de palabras clave importado
   *                                      Si no se proporciona, usa valores por defecto
   * @param {Array} exclusionWordsArray - Array de palabras que indican negación
   */
  constructor(keywordsDictionary = null, exclusionWordsArray = null) {
    /**
     * Diccionario de palabras clave por categoría
     * Puede ser proporcionado al instanciar o se carga desde keywords.js
     * @type {Object}
     */
    if (keywordsDictionary) {
      this.keywords = keywordsDictionary;
    } else {
      // Valores por defecto mínimos si keywords.js no está disponible
      this.keywords = {
        fitness: [
          'gym', 'gimnasio', 'entrenar', 'entrenamiento',
          'pesas', 'cardio', 'correr', 'yoga', 'pilates',
          'fitness', 'ejercicio', 'musculación', 'crossfit',
          'atletismo', 'boxeo', 'tenis', 'natación',
          'ciclismo', 'senderismo', 'trotar', 'caminar'
        ],
        shopping_lider: [
          'lider', 'compras', 'supermercado', 'mercado',
          'grocery', 'comprar comida', 'comprar alimentos',
          'abarrotes', 'despensa', 'ir al super',
          'hacer compras', 'lista de compras', 'carrito'
        ],
        pharmacy: [
          'farmacia', 'remedio', 'medicina', 'pastilla',
          'medicamento', 'comprar medicinas', 'receta',
          'doctor', 'farmacéutico', 'ibupirac', 'tafirol',
          'aspirin', 'antibiótico', 'vitamina', 'jarabe',
          'crema', 'ungüento', 'inyección', 'tableta',
          'cápsula', 'píldora', 'dosis', 'tratamiento'
        ]
      };
    }

    /**
     * Palabras que indican negación o exclusión
     * @type {Array}
     */
    if (exclusionWordsArray) {
      this.exclusionWords = exclusionWordsArray;
    } else {
      this.exclusionWords = [
        'no', 'sin', 'evitar', 'nunca', 'jamás', 'jamas'
      ];
    }
  }

  /**
   * Carga palabras clave desde el módulo keywords.js
   *
   * Uso:
   * ```javascript
   * const classifier = new TaskClassifier();
   * const keywordsLoaded = classifier.loadKeywords(CLASSIFIER_KEYWORDS);
   * if (keywordsLoaded) {
   *   console.log('Keywords cargadas exitosamente');
   * }
   * ```
   *
   * @param {Object} classifierKeywords - Objeto importado desde keywords.js
   * @returns {boolean} true si se cargaron exitosamente
   */
  loadKeywords(classifierKeywords) {
    try {
      if (!classifierKeywords || typeof classifierKeywords !== 'object') {
        console.warn('Invalid keywords object provided');
        return false;
      }

      // Validate that all required categories exist
      const requiredCategories = ['fitness', 'shopping_lider', 'pharmacy'];
      const hasAllCategories = requiredCategories.every(
        cat => Array.isArray(classifierKeywords[cat])
      );

      if (!hasAllCategories) {
        console.warn('Keywords object missing required categories');
        return false;
      }

      this.keywords = classifierKeywords;
      return true;
    } catch (error) {
      console.error('Error loading keywords:', error);
      return false;
    }
  }

  /**
   * Carga palabras de exclusión desde el módulo keywords.js
   *
   * @param {Array} exclusionWordsArray - Array de palabras de exclusión
   * @returns {boolean} true si se cargaron exitosamente
   */
  loadExclusionWords(exclusionWordsArray) {
    try {
      if (!Array.isArray(exclusionWordsArray)) {
        console.warn('Invalid exclusion words array');
        return false;
      }
      this.exclusionWords = exclusionWordsArray;
      return true;
    } catch (error) {
      console.error('Error loading exclusion words:', error);
      return false;
    }
  }

  /**
   * Clasifica una tarea según su nombre
   *
   * @param {string} taskName - Nombre de la tarea
   * @returns {Object} Objeto con categoria, confianza y coincidencias
   *
   * @example
   * const classifier = new TaskClassifier();
   * const result = classifier.classify('Ir al gimnasio');
   * // {
   * //   category: 'fitness',
   * //   confidence: 0.04,
   * //   matches: ['gym', 'gimnasio']
   * // }
   */
  classify(taskName) {
    if (!taskName || typeof taskName !== 'string') {
      return {
        category: 'general',
        confidence: 0,
        matches: []
      };
    }

    const name = taskName.toLowerCase().trim();

    // Buscar coincidencias en cada categoría
    const results = {};
    for (const [category, keywords] of Object.entries(this.keywords)) {
      const matches = keywords.filter(keyword =>
        name.includes(keyword)
      );

      if (matches.length > 0) {
        results[category] = {
          matches,
          confidence: this.calculateConfidence(matches.length, keywords.length)
        };
      }
    }

    // Si no hay coincidencias, retornar 'general'
    if (Object.keys(results).length === 0) {
      return {
        category: 'general',
        confidence: 0,
        matches: []
      };
    }

    // Si hay una sola categoría, retornarla
    if (Object.keys(results).length === 1) {
      const category = Object.keys(results)[0];
      return {
        category,
        confidence: results[category].confidence,
        matches: results[category].matches
      };
    }

    // Si hay múltiples categorías, retornar la con mayor confianza
    let topCategory = 'general';
    let topConfidence = 0;

    for (const [category, result] of Object.entries(results)) {
      if (result.confidence > topConfidence) {
        topConfidence = result.confidence;
        topCategory = category;
      }
    }

    return {
      category: topCategory,
      confidence: results[topCategory].confidence,
      matches: results[topCategory].matches
    };
  }

  /**
   * Calcula la confianza de la clasificación
   *
   * Basado en: número de coincidencias / total de palabras clave
   * Máximo 1.0 (100%)
   *
   * @private
   * @param {number} matchCount - Número de coincidencias encontradas
   * @param {number} totalKeywords - Total de palabras clave en la categoría
   * @returns {number} Confianza entre 0 y 1
   */
  calculateConfidence(matchCount, totalKeywords) {
    // Usar la proporción de coincidencias respecto al total
    // Limitado a máximo 1.0
    const confidence = Math.min(1, matchCount / Math.max(totalKeywords, 5));
    return Math.round(confidence * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Obtiene todas las categorías disponibles
   *
   * @returns {Array} Array de nombres de categorías
   */
  getCategories() {
    return Object.keys(this.keywords);
  }

  /**
   * Obtiene las palabras clave de una categoría
   *
   * @param {string} category - Nombre de la categoría
   * @returns {Array} Array de palabras clave para esa categoría
   */
  getKeywordsByCategory(category) {
    return this.keywords[category] || [];
  }

  /**
   * Agrega una palabra clave a una categoría
   *
   * @param {string} category - Nombre de la categoría
   * @param {string} keyword - Palabra clave a agregar
   * @returns {boolean} true si se agregó, false si ya existía
   */
  addKeyword(category, keyword) {
    if (!this.keywords[category]) {
      this.keywords[category] = [];
    }

    const normalizedKeyword = keyword.toLowerCase().trim();

    if (this.keywords[category].includes(normalizedKeyword)) {
      return false; // Ya existe
    }

    this.keywords[category].push(normalizedKeyword);
    return true;
  }

  /**
   * Elimina una palabra clave de una categoría
   *
   * @param {string} category - Nombre de la categoría
   * @param {string} keyword - Palabra clave a eliminar
   * @returns {boolean} true si se eliminó, false si no existía
   */
  removeKeyword(category, keyword) {
    if (!this.keywords[category]) {
      return false;
    }

    const normalizedKeyword = keyword.toLowerCase().trim();
    const index = this.keywords[category].indexOf(normalizedKeyword);

    if (index === -1) {
      return false; // No existe
    }

    this.keywords[category].splice(index, 1);
    return true;
  }

  /**
   * Agrega una nueva categoría
   *
   * @param {string} categoryName - Nombre de la nueva categoría
   * @param {Array} keywordsList - Array inicial de palabras clave (opcional)
   * @returns {boolean} true si se agregó, false si ya existía
   */
  addCategory(categoryName, keywordsList = []) {
    const normalizedName = categoryName.toLowerCase().trim();

    if (this.keywords[normalizedName]) {
      return false; // Ya existe
    }

    this.keywords[normalizedName] = keywordsList.map(k =>
      k.toLowerCase().trim()
    );
    return true;
  }

  /**
   * Obtiene estadísticas del clasificador
   *
   * @returns {Object} Objeto con estadísticas de categorías y palabras clave
   */
  getStatistics() {
    const stats = {
      totalCategories: Object.keys(this.keywords).length,
      categories: {},
      totalKeywords: 0
    };

    for (const [category, keywords] of Object.entries(this.keywords)) {
      stats.categories[category] = keywords.length;
      stats.totalKeywords += keywords.length;
    }

    return stats;
  }

  /**
   * Exporta el clasificador como JSON
   * Útil para debugging y almacenamiento
   *
   * @returns {string} JSON stringificado del clasificador
   */
  toJSON() {
    return JSON.stringify({
      keywords: this.keywords,
      categories: Object.keys(this.keywords),
      statistics: this.getStatistics()
    }, null, 2);
  }

  /**
   * Importa palabras clave desde un JSON
   *
   * @param {string} jsonString - String JSON con estructura de keywords
   * @returns {boolean} true si se importó correctamente
   */
  fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.keywords && typeof data.keywords === 'object') {
        this.keywords = data.keywords;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing classifier JSON:', error);
      return false;
    }
  }
}

// Exportar para uso en navegadores y Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaskClassifier;
}

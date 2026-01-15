/**
 * Prompt Generator Service
 * Generates relevant prompts based on category and brands
 */

class PromptGenerator {
  constructor() {
    this.templates = {
      commercial: [
        "What is the best {category} for small businesses?",
        "What are the top {category} in 2025?",
        "Which {category} should I use for my startup?",
        "Best {category} for enterprises",
        "Most popular {category} solutions",
        "What {category} do experts recommend?",
        "Best value {category} for the price",
        "What is the most reliable {category}?",
        "Which {category} has the best customer support?",
        "Best {category} for beginners",
      ],
      comparison: [
        "Compare the top {category} solutions",
        "What are the differences between popular {category}?",
        "Which {category} has the best features?",
        "Best {category} comparison 2025",
        "How do the leading {category} compare in pricing?",
      ],
      alternative: [
        "What are alternatives to {brand}?",
        "Best {brand} competitors",
        "{brand} vs competitors - which is better?",
        "Cheaper alternatives to {brand}",
        "Free alternatives to {brand}",
      ],
      specific: [
        "Best {category} for freelancers",
        "Best {category} with mobile app",
        "Best {category} for remote teams",
        "Easiest {category} to use",
        "Best free {category}",
        "Best {category} with integrations",
        "Best {category} for agencies",
        "Best {category} with API access",
        "Most affordable {category}",
        "Best {category} for large teams",
      ],
    };
  }

  /**
   * Generate prompts for a given category and set of brands
   * @param {string} category - The product category (e.g., "CRM software")
   * @param {string[]} brands - Array of brand names to track
   * @param {Object} options - Generation options
   * @returns {Array} Array of prompt objects
   */
  generate(category, brands, options = {}) {
    const { 
      count = 25, 
      intentTypes = ['commercial', 'comparison', 'alternative', 'specific'] 
    } = options;
    
    const prompts = [];
    let id = 1;

    // Calculate prompts per intent type
    const promptsPerType = Math.ceil(count / intentTypes.length);

    for (const intentType of intentTypes) {
      const templates = this.templates[intentType] || [];
      let typePrompts = 0;

      for (const template of templates) {
        if (typePrompts >= promptsPerType) break;
        if (prompts.length >= count) break;

        if (template.includes('{brand}')) {
          // Generate one prompt per brand for brand-specific queries
          for (const brand of brands) {
            if (typePrompts >= promptsPerType) break;
            if (prompts.length >= count) break;
            
            const text = template
              .replace(/{brand}/g, brand)
              .replace(/{category}/g, category);
            
            prompts.push({
              id: id++,
              text,
              intentType,
            });
            typePrompts++;
          }
        } else {
          // Generate category-level prompts
          const text = template.replace(/{category}/g, category);
          
          prompts.push({
            id: id++,
            text,
            intentType,
          });
          typePrompts++;
        }
      }
    }

    return prompts.slice(0, count);
  }

  /**
   * Get available intent types
   */
  getIntentTypes() {
    return Object.keys(this.templates);
  }

  /**
   * Add custom prompt template
   */
  addTemplate(intentType, template) {
    if (!this.templates[intentType]) {
      this.templates[intentType] = [];
    }
    this.templates[intentType].push(template);
  }
}

export default PromptGenerator; 
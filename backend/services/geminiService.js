/**
 * Gemini AI Service
 * Handles AI queries with Google Search grounding
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }],
    });
  }

  /**
   * Query Gemini with a prompt and extract brand mentions/citations
   * @param {string} prompt - The search prompt
   * @param {string[]} brands - Brands to look for in the response
   * @returns {Object} Analysis result
   */
  async analyzePrompt(prompt, brands) {
    const startTime = Date.now();
    
    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });

      const response = result.response;
      const text = response.text();
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const processingTime = Date.now() - startTime;

      // Extract brand mentions
      const mentions = this.extractBrandMentions(text, brands);
      
      // Extract citations from grounding metadata
      const citations = this.extractCitations(groundingMetadata);

      return {
        success: true,
        prompt,
        response: text,
        responseLength: text.length,
        processingTimeMs: processingTime,
        mentions,
        citations,
        searchQueries: groundingMetadata?.webSearchQueries || [],
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        prompt,
        error: error.message,
        processingTimeMs: Date.now() - startTime,
        mentions: brands.map(brand => ({
          brand,
          mentioned: false,
          count: 0,
          position: null,
          context: null,
          sentiment: null,
        })),
        citations: [],
      };
    }
  }

  /**
   * Extract brand mentions from response text
   */
  extractBrandMentions(text, brands) {
    const mentions = [];

    // First pass: find all brand positions to determine order
    const brandPositions = brands.map(brand => {
      const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, 'i');
      const match = text.match(regex);
      return {
        brand,
        firstIndex: match ? match.index : -1,
      };
    }).filter(b => b.firstIndex !== -1)
      .sort((a, b) => a.firstIndex - b.firstIndex);

    // Create position map
    const positionMap = {};
    brandPositions.forEach((item, index) => {
      positionMap[item.brand] = index + 1;
    });

    // Second pass: extract detailed mention info
    for (const brand of brands) {
      const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, 'gi');
      const matches = [...text.matchAll(regex)];

      if (matches.length > 0) {
        // Get context around first mention
        const firstMatch = matches[0];
        const contextStart = Math.max(0, firstMatch.index - 150);
        const contextEnd = Math.min(text.length, firstMatch.index + brand.length + 150);
        const context = text.slice(contextStart, contextEnd).trim();

        // Analyze sentiment of context
        const sentimentResult = this.analyzeSentiment(context, brand);

        // Check if brand is recommended
        const isRecommended = this.checkIfRecommended(text, brand);

        mentions.push({
          brand,
          mentioned: true,
          count: matches.length,
          position: positionMap[brand] || null,
          context,
          sentiment: sentimentResult.sentiment,
          sentimentScore: sentimentResult.score,
          isRecommended,
        });
      } else {
        mentions.push({
          brand,
          mentioned: false,
          count: 0,
          position: null,
          context: null,
          sentiment: null,
          sentimentScore: null,
          isRecommended: false,
        });
      }
    }

    return mentions;
  }

  /**
   * Extract citations from Gemini grounding metadata
   */
  extractCitations(groundingMetadata) {
    if (!groundingMetadata) return [];

    const citations = [];
    const seenUrls = new Set();

    // Extract from grounding chunks
    const chunks = groundingMetadata.groundingChunks || [];
    for (const chunk of chunks) {
      if (chunk.web && !seenUrls.has(chunk.web.uri)) {
        seenUrls.add(chunk.web.uri);
        citations.push({
          url: chunk.web.uri,
          title: chunk.web.title || '',
          domain: this.extractDomain(chunk.web.uri),
        });
      }
    }

    // Also check grounding supports for additional sources
    const supports = groundingMetadata.groundingSupports || [];
    for (const support of supports) {
      if (support.segment?.startIndex !== undefined) {
        // This maps text segments to citation indices
        // We've already captured the sources above
      }
    }

    return citations;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /**
   * Analyze sentiment of text around brand mention
   */
  analyzeSentiment(context, brand) {
    const lowerContext = context.toLowerCase();
    const lowerBrand = brand.toLowerCase();
    
    const positivePatterns = [
      'best', 'excellent', 'great', 'recommended', 'leading', 'top',
      'powerful', 'popular', 'reliable', 'trusted', 'innovative',
      'easy to use', 'intuitive', 'robust', 'comprehensive', 'outstanding',
      'impressive', 'exceptional', 'superior', 'favorite', 'preferred',
      'highly rated', 'well-known', 'industry leader', 'market leader',
      'stands out', 'excels', 'shines', 'ideal', 'perfect for'
    ];
    
    const negativePatterns = [
      'expensive', 'complex', 'difficult', 'limited', 'lacking',
      'poor', 'slow', 'outdated', 'complicated', 'overpriced',
      'basic', 'frustrating', 'clunky', 'steep learning curve',
      'confusing', 'unreliable', 'disappointing', 'worst', 'avoid',
      'issues', 'problems', 'bugs', 'crashes', 'not recommended'
    ];

    let score = 0;
    let matchedPositive = 0;
    let matchedNegative = 0;

    // Check for positive patterns near brand mention
    for (const pattern of positivePatterns) {
      if (lowerContext.includes(pattern)) {
        score += 1;
        matchedPositive++;
      }
    }

    // Check for negative patterns
    for (const pattern of negativePatterns) {
      if (lowerContext.includes(pattern)) {
        score -= 1;
        matchedNegative++;
      }
    }

    // Normalize score to -1 to 1 range
    const totalMatches = matchedPositive + matchedNegative;
    const normalizedScore = totalMatches > 0 
      ? Math.max(-1, Math.min(1, score / Math.max(matchedPositive, matchedNegative, 1)))
      : 0;

    let sentiment;
    if (normalizedScore > 0.2) {
      sentiment = 'positive';
    } else if (normalizedScore < -0.2) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return { sentiment, score: normalizedScore };
  }

  /**
   * Check if brand is explicitly recommended
   */
  checkIfRecommended(text, brand) {
    const lowerText = text.toLowerCase();
    const lowerBrand = brand.toLowerCase();
    
    const recommendPatterns = [
      `recommend ${lowerBrand}`,
      `${lowerBrand} is recommended`,
      `suggest ${lowerBrand}`,
      `${lowerBrand} is a great choice`,
      `${lowerBrand} is ideal`,
      `${lowerBrand} is perfect`,
      `${lowerBrand} is the best`,
      `top pick.*${lowerBrand}`,
      `${lowerBrand}.*top pick`,
      `best.*${lowerBrand}`,
      `${lowerBrand}.*stands out`,
    ];

    return recommendPatterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(lowerText);
    });
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default GeminiService;
/**
 * Analysis Runner Service
 * Orchestrates the full analysis pipeline
 */

import GeminiService from './geminiService.js';

class AnalysisRunner {
  constructor(apiKey, prisma) {
    this.gemini = new GeminiService(apiKey);
    this.prisma = prisma;
  }

  /**
   * Run a complete analysis for a project
   * @param {string} projectId - Project ID
   * @param {string} runId - Analysis run ID
   * @param {Function} onProgress - Progress callback
   */
  async runAnalysis(projectId, runId, onProgress = null) {
    // Get project with brands and prompts
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brands: true,
        prompts: { where: { isActive: true } },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const brandNames = project.brands.map(b => b.name);
    const prompts = project.prompts;

    // Update run status
    await this.prisma.analysisRun.update({
      where: { id: runId },
      data: {
        status: 'processing',
        totalPrompts: prompts.length,
        startedAt: new Date(),
      },
    });

    const results = [];

    // Process each prompt
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      try {
        // Add delay between requests to avoid rate limits
        if (i > 0) {
          await this.delay(1500);
        }

        // Query Gemini
        const result = await this.gemini.analyzePrompt(prompt.text, brandNames);

        // Save prompt result
        const promptResult = await this.prisma.promptResult.create({
          data: {
            analysisRunId: runId,
            promptId: prompt.id,
            rawResponse: result.response || null,
            responseLength: result.responseLength || null,
            processingTimeMs: result.processingTimeMs,
            error: result.error || null,
          },
        });

        // Save brand mentions
        if (result.mentions && result.mentions.length > 0) {
          for (const mention of result.mentions) {
            const brand = project.brands.find(b => b.name === mention.brand);
            if (brand) {
              await this.prisma.brandMention.create({
                data: {
                  promptResultId: promptResult.id,
                  brandId: brand.id,
                  position: mention.position,
                  sentiment: mention.sentiment,
                  sentimentScore: mention.sentimentScore,
                  contextSnippet: mention.context,
                  isRecommended: mention.isRecommended || false,
                },
              });
            }
          }
        }

        // Save citations
        if (result.citations && result.citations.length > 0) {
          for (const citation of result.citations) {
            await this.prisma.citation.create({
              data: {
                promptResultId: promptResult.id,
                url: citation.url,
                domain: citation.domain,
                title: citation.title || null,
              },
            });
          }
        }

        results.push({ promptId: prompt.id, success: true, ...result });

        // Update progress
        await this.prisma.analysisRun.update({
          where: { id: runId },
          data: { processedPrompts: i + 1 },
        });

        if (onProgress) {
          onProgress({
            type: 'progress',
            processed: i + 1,
            total: prompts.length,
            currentPrompt: prompt.text,
          });
        }

        console.log(`✓ [${i + 1}/${prompts.length}] ${prompt.text.slice(0, 50)}...`);

      } catch (error) {
        console.error(`✗ [${i + 1}/${prompts.length}] Error:`, error.message);
        
        // Save error result
        await this.prisma.promptResult.create({
          data: {
            analysisRunId: runId,
            promptId: prompt.id,
            error: error.message,
          },
        });

        results.push({ promptId: prompt.id, success: false, error: error.message });
      }
    }

    // Calculate and save aggregate metrics
    await this.calculateMetrics(runId, project);

    // Mark run as completed
    await this.prisma.analysisRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    if (onProgress) {
      onProgress({ type: 'complete', runId });
    }

    return results;
  }

  /**
   * Calculate aggregate metrics for the analysis run
   */
  async calculateMetrics(runId, project) {
    const totalPrompts = project.prompts.filter(p => p.isActive).length;

    // Get all brand mentions for this run
    const promptResults = await this.prisma.promptResult.findMany({
      where: { analysisRunId: runId },
      include: {
        brandMentions: true,
        citations: true,
      },
    });

    const validResults = promptResults.filter(r => !r.error);

    // Calculate metrics for each brand
    for (const brand of project.brands) {
      // Get mentions for this brand
      const brandMentions = validResults.flatMap(r => 
        r.brandMentions.filter(m => m.brandId === brand.id)
      );

      const mentionedResults = brandMentions.filter(m => m.position !== null);
      const mentionCount = mentionedResults.length;
      
      // Visibility score
      const visibilityScore = validResults.length > 0 
        ? (mentionCount / validResults.length) * 100 
        : 0;

      // Average position
      const positions = mentionedResults.map(m => m.position).filter(p => p !== null);
      const averagePosition = positions.length > 0
        ? positions.reduce((a, b) => a + b, 0) / positions.length
        : null;

      // First position count
      const firstPositionCount = positions.filter(p => p === 1).length;

      // Sentiment breakdown
      const positiveMentions = mentionedResults.filter(m => m.sentiment === 'positive').length;
      const neutralMentions = mentionedResults.filter(m => m.sentiment === 'neutral').length;
      const negativeMentions = mentionedResults.filter(m => m.sentiment === 'negative').length;

      // Average sentiment score
      const sentimentScores = mentionedResults
        .map(m => m.sentimentScore)
        .filter(s => s !== null);
      const averageSentiment = sentimentScores.length > 0
        ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
        : null;

      // Recommendation count
      const recommendationCount = mentionedResults.filter(m => m.isRecommended).length;

      // Citation count (count citations from pages that mention this brand)
      // This is a simplified version - could be enhanced
      const citationCount = validResults
        .filter(r => r.brandMentions.some(m => m.brandId === brand.id && m.position !== null))
        .reduce((sum, r) => sum + r.citations.length, 0);

      // Save metrics snapshot
      await this.prisma.metricsSnapshot.upsert({
        where: {
          analysisRunId_brandId: {
            analysisRunId: runId,
            brandId: brand.id,
          },
        },
        create: {
          analysisRunId: runId,
          brandId: brand.id,
          visibilityScore,
          mentionCount,
          citationCount,
          averagePosition,
          positiveMentions,
          neutralMentions,
          negativeMentions,
          averageSentiment,
          recommendationCount,
          firstPositionCount,
        },
        update: {
          visibilityScore,
          mentionCount,
          citationCount,
          averagePosition,
          positiveMentions,
          neutralMentions,
          negativeMentions,
          averageSentiment,
          recommendationCount,
          firstPositionCount,
        },
      });
    }

    // Calculate share of voice
    const totalMentions = await this.prisma.metricsSnapshot.aggregate({
      where: { analysisRunId: runId },
      _sum: { mentionCount: true },
    });

    const total = totalMentions._sum.mentionCount || 0;

    if (total > 0) {
      const snapshots = await this.prisma.metricsSnapshot.findMany({
        where: { analysisRunId: runId },
      });

      for (const snapshot of snapshots) {
        await this.prisma.metricsSnapshot.update({
          where: { id: snapshot.id },
          data: {
            shareOfVoice: (snapshot.mentionCount / total) * 100,
          },
        });
      }
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AnalysisRunner;
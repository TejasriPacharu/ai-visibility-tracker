/**
 * Dashboard Routes
 * Provide aggregated metrics and insights
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /api/dashboard/:projectId
 * Get comprehensive dashboard data
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { runId } = req.query;
    const { projectId } = req.params;

    // Get project info
    const project = await req.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brands: true,
        _count: { select: { prompts: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the target analysis run
    let analysisRun;
    if (runId) {
      analysisRun = await req.prisma.analysisRun.findUnique({
        where: { id: runId },
      });
    } else {
      analysisRun = await req.prisma.analysisRun.findFirst({
        where: { projectId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });
    }

    if (!analysisRun) {
      return res.json({
        project,
        hasData: false,
        message: 'No completed analysis runs. Run an analysis to see metrics.',
      });
    }

    // Get metrics for all brands
    const metrics = await req.prisma.metricsSnapshot.findMany({
      where: { analysisRunId: analysisRun.id },
      include: { brand: true },
      orderBy: { visibilityScore: 'desc' },
    });

    // Get user brand metrics
    const userBrandMetrics = metrics.find(m => m.brand.isUserBrand);

    // Get citation stats
    const citations = await req.prisma.citation.findMany({
      where: {
        promptResult: { analysisRunId: analysisRun.id },
      },
    });

    // Aggregate citations by domain
    const domainCounts = {};
    citations.forEach(c => {
      domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
    });

    const topCitedDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({
        domain,
        count,
        percentage: citations.length > 0 ? (count / citations.length) * 100 : 0,
      }));

    // Get prompt results summary
    const promptResults = await req.prisma.promptResult.findMany({
      where: { analysisRunId: analysisRun.id },
      include: {
        prompt: true,
        brandMentions: {
          where: { brand: { isUserBrand: true } },
        },
      },
    });

    const userBrand = project.brands.find(b => b.isUserBrand);
    
    const mentionedPrompts = promptResults.filter(r => 
      r.brandMentions.some(m => m.position !== null)
    );
    
    const notMentionedPrompts = promptResults.filter(r =>
      !r.brandMentions.some(m => m.position !== null)
    );

    res.json({
      project,
      hasData: true,
      analysisRun: {
        id: analysisRun.id,
        status: analysisRun.status,
        completedAt: analysisRun.completedAt,
        totalPrompts: analysisRun.totalPrompts,
      },
      summary: {
        totalPrompts: analysisRun.totalPrompts,
        totalBrands: project.brands.length,
        totalCitations: citations.length,
        userBrand: userBrand?.name,
        userBrandVisibility: userBrandMetrics?.visibilityScore || 0,
        userBrandShareOfVoice: userBrandMetrics?.shareOfVoice || 0,
        userBrandAvgPosition: userBrandMetrics?.averagePosition,
      },
      brandComparison: metrics.map(m => ({
        id: m.brand.id,
        name: m.brand.name,
        isUserBrand: m.brand.isUserBrand,
        visibility: m.visibilityScore || 0,
        shareOfVoice: m.shareOfVoice || 0,
        mentionCount: m.mentionCount,
        avgPosition: m.averagePosition,
        firstPositionCount: m.firstPositionCount,
        sentiment: {
          positive: m.positiveMentions,
          neutral: m.neutralMentions,
          negative: m.negativeMentions,
          average: m.averageSentiment,
        },
        recommendations: m.recommendationCount,
      })),
      topCitedDomains,
      promptsSummary: {
        mentioned: mentionedPrompts.length,
        notMentioned: notMentionedPrompts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/:projectId/prompts
 * Get detailed prompt-level data for dashboard
 */
router.get('/:projectId/prompts', async (req, res, next) => {
  try {
    const { runId, filter = 'all' } = req.query;
    const { projectId } = req.params;

    // Get target run
    let analysisRun;
    if (runId) {
      analysisRun = await req.prisma.analysisRun.findUnique({
        where: { id: runId },
      });
    } else {
      analysisRun = await req.prisma.analysisRun.findFirst({
        where: { projectId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });
    }

    if (!analysisRun) {
      return res.json({ prompts: [], message: 'No completed analysis runs' });
    }

    // Get user brand
    const userBrand = await req.prisma.brand.findFirst({
      where: { projectId, isUserBrand: true },
    });

    // Get all prompt results
    const results = await req.prisma.promptResult.findMany({
      where: { analysisRunId: analysisRun.id },
      include: {
        prompt: true,
        brandMentions: {
          include: { brand: true },
          orderBy: { position: 'asc' },
        },
        citations: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Process results
    const prompts = results.map(r => {
      const userMention = r.brandMentions.find(m => m.brandId === userBrand?.id);
      const isMentioned = userMention?.position !== null;

      return {
        id: r.prompt.id,
        text: r.prompt.text,
        intentType: r.prompt.intentType,
        isMentioned,
        position: userMention?.position || null,
        sentiment: userMention?.sentiment || null,
        isRecommended: userMention?.isRecommended || false,
        context: userMention?.contextSnippet || null,
        allMentions: r.brandMentions
          .filter(m => m.position !== null)
          .map(m => ({
            brand: m.brand.name,
            position: m.position,
            sentiment: m.sentiment,
          })),
        citationCount: r.citations.length,
        topCitation: r.citations[0]?.domain || null,
      };
    });

    // Apply filter
    let filteredPrompts = prompts;
    if (filter === 'mentioned') {
      filteredPrompts = prompts.filter(p => p.isMentioned);
    } else if (filter === 'not-mentioned') {
      filteredPrompts = prompts.filter(p => !p.isMentioned);
    }

    res.json({
      prompts: filteredPrompts,
      total: prompts.length,
      mentioned: prompts.filter(p => p.isMentioned).length,
      notMentioned: prompts.filter(p => !p.isMentioned).length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/:projectId/citations
 * Get citation analysis
 */
router.get('/:projectId/citations', async (req, res, next) => {
  try {
    const { runId, limit = 20 } = req.query;
    const { projectId } = req.params;

    // Get target run
    let analysisRun;
    if (runId) {
      analysisRun = await req.prisma.analysisRun.findUnique({
        where: { id: runId },
      });
    } else {
      analysisRun = await req.prisma.analysisRun.findFirst({
        where: { projectId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });
    }

    if (!analysisRun) {
      return res.json({ citations: [], domains: [] });
    }

    // Get all citations
    const citations = await req.prisma.citation.findMany({
      where: {
        promptResult: { analysisRunId: analysisRun.id },
      },
      include: {
        promptResult: {
          include: { prompt: true },
        },
      },
    });

    // Aggregate by domain
    const domainData = {};
    citations.forEach(c => {
      if (!domainData[c.domain]) {
        domainData[c.domain] = {
          domain: c.domain,
          count: 0,
          urls: new Set(),
          prompts: new Set(),
        };
      }
      domainData[c.domain].count++;
      domainData[c.domain].urls.add(c.url);
      domainData[c.domain].prompts.add(c.promptResult.prompt.text);
    });

    const domains = Object.values(domainData)
      .map(d => ({
        domain: d.domain,
        citationCount: d.count,
        uniqueUrls: d.urls.size,
        promptsCited: d.prompts.size,
        percentage: (d.count / citations.length) * 100,
      }))
      .sort((a, b) => b.citationCount - a.citationCount)
      .slice(0, parseInt(limit));

    // Get top pages
    const pageCounts = {};
    citations.forEach(c => {
      const key = c.url;
      if (!pageCounts[key]) {
        pageCounts[key] = { url: c.url, domain: c.domain, title: c.title, count: 0 };
      }
      pageCounts[key].count++;
    });

    const topPages = Object.values(pageCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    res.json({
      totalCitations: citations.length,
      uniqueDomains: Object.keys(domainData).length,
      domains,
      topPages,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/:projectId/trends
 * Get historical trend data across runs
 */
router.get('/:projectId/trends', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.query;

    // Get user brand
    const userBrand = await req.prisma.brand.findFirst({
      where: { projectId, isUserBrand: true },
    });

    if (!userBrand) {
      return res.json({ trends: [] });
    }

    // Get metrics across runs
    const metrics = await req.prisma.metricsSnapshot.findMany({
      where: { brandId: userBrand.id },
      include: {
        analysisRun: {
          select: { completedAt: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const trends = metrics
      .filter(m => m.analysisRun.status === 'completed')
      .map(m => ({
        date: m.analysisRun.completedAt,
        visibility: m.visibilityScore,
        shareOfVoice: m.shareOfVoice,
        avgPosition: m.averagePosition,
        mentionCount: m.mentionCount,
        sentiment: m.averageSentiment,
      }))
      .reverse();

    res.json({ trends });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/:projectId/competitors
 * Get detailed competitor comparison
 */
router.get('/:projectId/competitors', async (req, res, next) => {
  try {
    const { runId } = req.query;
    const { projectId } = req.params;

    // Get target run
    let analysisRun;
    if (runId) {
      analysisRun = await req.prisma.analysisRun.findUnique({
        where: { id: runId },
      });
    } else {
      analysisRun = await req.prisma.analysisRun.findFirst({
        where: { projectId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });
    }

    if (!analysisRun) {
      return res.json({ competitors: [] });
    }

    // Get all brand metrics
    const metrics = await req.prisma.metricsSnapshot.findMany({
      where: { analysisRunId: analysisRun.id },
      include: { brand: true },
    });

    const userMetrics = metrics.find(m => m.brand.isUserBrand);
    
    const competitors = metrics
      .filter(m => !m.brand.isUserBrand)
      .map(m => ({
        name: m.brand.name,
        visibility: m.visibilityScore || 0,
        shareOfVoice: m.shareOfVoice || 0,
        avgPosition: m.averagePosition,
        mentionCount: m.mentionCount,
        sentiment: m.averageSentiment,
        // Comparison with user brand
        visibilityGap: userMetrics 
          ? (m.visibilityScore || 0) - (userMetrics.visibilityScore || 0)
          : null,
        positionGap: userMetrics?.averagePosition && m.averagePosition
          ? m.averagePosition - userMetrics.averagePosition
          : null,
      }))
      .sort((a, b) => b.visibility - a.visibility);

    res.json({
      userBrand: userMetrics ? {
        name: userMetrics.brand.name,
        visibility: userMetrics.visibilityScore || 0,
        shareOfVoice: userMetrics.shareOfVoice || 0,
        avgPosition: userMetrics.averagePosition,
      } : null,
      competitors,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
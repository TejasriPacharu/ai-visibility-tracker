/**
 * Analysis Routes
 * Handle analysis runs and results
 */

import { Router } from 'express';
import AnalysisRunner from '../services/analysisRunner.js';

const router = Router();

// Store for SSE clients
const sseClients = new Map();

/**
 * POST /api/analysis/:projectId/run
 * Start a new analysis run
 */
router.post('/:projectId/run', async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if project exists
    const project = await req.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        prompts: { where: { isActive: true } },
        brands: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.prompts.length === 0) {
      return res.status(400).json({ error: 'No active prompts to analyze' });
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY not configured. Please add it to your .env file.' 
      });
    }

    // Check if there's already a running analysis
    const runningAnalysis = await req.prisma.analysisRun.findFirst({
      where: {
        projectId,
        status: 'processing',
      },
    });

    if (runningAnalysis) {
      return res.status(400).json({ 
        error: 'An analysis is already running for this project',
        runId: runningAnalysis.id,
      });
    }

    // Create analysis run
    const analysisRun = await req.prisma.analysisRun.create({
      data: {
        projectId,
        status: 'pending',
        totalPrompts: project.prompts.length,
      },
    });

    // Return immediately, run analysis in background
    res.status(202).json({
      message: 'Analysis started',
      runId: analysisRun.id,
      totalPrompts: project.prompts.length,
      estimatedTimeSeconds: project.prompts.length * 2,
    });

    // Run analysis in background
    const runner = new AnalysisRunner(process.env.GEMINI_API_KEY, req.prisma);
    
    runner.runAnalysis(projectId, analysisRun.id, (progress) => {
      // Send SSE updates to connected clients
      const client = sseClients.get(analysisRun.id);
      if (client) {
        client.write(`data: ${JSON.stringify(progress)}\n\n`);
        if (progress.type === 'complete') {
          client.end();
          sseClients.delete(analysisRun.id);
        }
      }
    }).catch(async (error) => {
      console.error('Analysis failed:', error);
      await req.prisma.analysisRun.update({
        where: { id: analysisRun.id },
        data: { status: 'failed' },
      });
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/:projectId/runs
 * List all analysis runs for a project
 */
router.get('/:projectId/runs', async (req, res, next) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const [runs, total] = await Promise.all([
      req.prisma.analysisRun.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          _count: {
            select: { promptResults: true },
          },
        },
      }),
      req.prisma.analysisRun.count({
        where: { projectId: req.params.projectId },
      }),
    ]);

    res.json({ runs, total });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/:projectId/runs/:runId
 * Get details of a specific run
 */
router.get('/:projectId/runs/:runId', async (req, res, next) => {
  try {
    const run = await req.prisma.analysisRun.findUnique({
      where: { id: req.params.runId },
      include: {
        metricsSnapshots: {
          include: { brand: true },
        },
        promptResults: {
          include: {
            prompt: true,
            brandMentions: {
              include: { brand: true },
            },
            citations: true,
          },
        },
      },
    });

    if (!run) {
      return res.status(404).json({ error: 'Analysis run not found' });
    }

    res.json({ run });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/:projectId/runs/:runId/stream
 * SSE endpoint for real-time progress updates
 */
router.get('/:projectId/runs/:runId/stream', async (req, res) => {
  const { runId } = req.params;

  // Check if run exists
  const run = await req.prisma.analysisRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return res.status(404).json({ error: 'Analysis run not found' });
  }

  // If already completed, send completion event
  if (run.status === 'completed') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'complete', runId })}\n\n`);
    return res.end();
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial event
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    runId,
    status: run.status,
    processed: run.processedPrompts,
    total: run.totalPrompts,
  })}\n\n`);

  // Store client for updates
  sseClients.set(runId, res);

  // Clean up on disconnect
  req.on('close', () => {
    sseClients.delete(runId);
  });
});

/**
 * GET /api/analysis/:projectId/runs/:runId/results
 * Get prompt-level results for a run  -> get the results fo the run 
 */
router.get('/:projectId/runs/:runId/results', async (req, res, next) => {
  try {
    const { brandId, mentioned } = req.query;

    const results = await req.prisma.promptResult.findMany({
      where: {
        analysisRunId: req.params.runId,
        ...(brandId && mentioned !== undefined && {
          brandMentions: {
            some: {
              brandId,
              position: mentioned === 'true' ? { not: null } : null,
            },
          },
        }),
      },
      include: {
        prompt: true,
        brandMentions: {
          include: { brand: true },
        },
        citations: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/:projectId/latest
 * Get the latest completed analysis run   -> the last run for that project
 */
router.get('/:projectId/latest', async (req, res, next) => {
  try {
    const run = await req.prisma.analysisRun.findFirst({
      where: {
        projectId: req.params.projectId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      include: {
        metricsSnapshots: {
          include: { brand: true },
        },
      },
    });

    if (!run) {
      return res.status(404).json({ error: 'No completed analysis runs found' });
    }

    res.json({ run });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/analysis/:projectId/runs/:runId
 * Delete an analysis run
 */
router.delete('/:projectId/runs/:runId', async (req, res, next) => {
  try {
    await req.prisma.analysisRun.delete({
      where: { id: req.params.runId },
    });

    res.json({ message: 'Analysis run deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
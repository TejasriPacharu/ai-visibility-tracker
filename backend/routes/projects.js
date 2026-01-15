/**
 * Projects Routes
 * Handle CRUD operations for tracking projects
 */

import { Router } from 'express';
import PromptGenerator from '../services/promptGenerator.js';

const router = Router();
const promptGenerator = new PromptGenerator();

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req, res, next) => {
  try {
    const projects = await req.prisma.project.findMany({
      include: {
        brands: true,
        _count: {
          select: {
            prompts: true,
            analysisRuns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id
 * Get project details with latest metrics
 */
router.get('/:id', async (req, res, next) => {
  try {
    const project = await req.prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        brands: {
          include: {
            metricsSnapshots: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        prompts: {
          orderBy: { createdAt: 'asc' },
        },
        analysisRuns: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects
 * Create a new tracking project
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, category, userBrand, competitors = [] } = req.body;

    if (!name || !category || !userBrand) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, category, userBrand' 
      });
    }

    // Create all brand names (user brand + competitors)
    const allBrands = [userBrand, ...competitors.filter(c => c !== userBrand)];

    // Create project with brands
    const project = await req.prisma.project.create({
      data: {
        name,
        category,
        userBrand,
        brands: {
          create: allBrands.map(brandName => ({
            name: brandName,
            isUserBrand: brandName === userBrand,
          })),
        },
      },
      include: {
        brands: true,
      },
    });

    // Generate prompts
    const generatedPrompts = promptGenerator.generate(category, allBrands, { count: 25 });

    // Save prompts
    await req.prisma.prompt.createMany({
      data: generatedPrompts.map(p => ({
        projectId: project.id,
        text: p.text,
        intentType: p.intentType,
      })),
    });

    // Fetch complete project
    const completeProject = await req.prisma.project.findUnique({
      where: { id: project.id },
      include: {
        brands: true,
        prompts: true,
      },
    });

    res.status(201).json({ 
      project: completeProject,
      message: `Created project with ${generatedPrompts.length} prompts` 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/projects/:id
 * Update project details
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, category } = req.body;

    const project = await req.prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
      },
    });

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project and all associated data
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/brands
 * Add a competitor brand
 */
router.post('/:id/brands', async (req, res, next) => {
  try {
    const { name, websiteUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    const brand = await req.prisma.brand.create({
      data: {
        projectId: req.params.id,
        name,
        websiteUrl,
        isUserBrand: false,
      },
    });

    res.status(201).json({ brand });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Brand already exists in this project' });
    }
    next(error);
  }
});

/**
 * DELETE /api/projects/:id/brands/:brandId
 * Remove a brand from tracking
 */
router.delete('/:id/brands/:brandId', async (req, res, next) => {
  try {
    const brand = await req.prisma.brand.findUnique({
      where: { id: req.params.brandId },
    });

    if (brand?.isUserBrand) {
      return res.status(400).json({ error: 'Cannot delete the primary user brand' });
    }

    await req.prisma.brand.delete({
      where: { id: req.params.brandId },
    });

    res.json({ message: 'Brand removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id/prompts
 * List all prompts for a project
 */
router.get('/:id/prompts', async (req, res, next) => {
  try {
    const { intentType, isActive } = req.query;

    const prompts = await req.prisma.prompt.findMany({
      where: {
        projectId: req.params.id,
        ...(intentType && { intentType }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ prompts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/prompts
 * Add a custom prompt
 */
router.post('/:id/prompts', async (req, res, next) => {
  try {
    const { text, intentType = 'custom' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Prompt text is required' });
    }

    const prompt = await req.prisma.prompt.create({
      data: {
        projectId: req.params.id,
        text,
        intentType,
      },
    });

    res.status(201).json({ prompt });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/projects/:id/prompts/:promptId
 * Update a prompt
 */
router.patch('/:id/prompts/:promptId', async (req, res, next) => {
  try {
    const { text, isActive } = req.body;

    const prompt = await req.prisma.prompt.update({
      where: { id: req.params.promptId },
      data: {
        ...(text !== undefined && { text }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ prompt });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:id/prompts/:promptId
 * Delete a prompt
 */
router.delete('/:id/prompts/:promptId', async (req, res, next) => {
  try {
    await req.prisma.prompt.delete({
      where: { id: req.params.promptId },
    });

    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:id/prompts/generate
 * Generate additional prompts
 */
router.post('/:id/prompts/generate', async (req, res, next) => {
  try {
    const { count = 10, intentTypes } = req.body;

    const project = await req.prisma.project.findUnique({
      where: { id: req.params.id },
      include: { brands: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const brandNames = project.brands.map(b => b.name);
    const options = {
      count,
      ...(intentTypes && { intentTypes }),
    };

    const generatedPrompts = promptGenerator.generate(project.category, brandNames, options);

    // Save new prompts
    await req.prisma.prompt.createMany({
      data: generatedPrompts.map(p => ({
        projectId: project.id,
        text: p.text,
        intentType: p.intentType,
      })),
    });

    res.json({ 
      message: `Generated ${generatedPrompts.length} new prompts`,
      prompts: generatedPrompts,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
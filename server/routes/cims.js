const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const cimService = require('../services/cimService');
const Joi = require('joi');

const prisma = new PrismaClient();

// Validation schemas
const createCIMSchema = Joi.object({
  title: Joi.string().required(),
  companyId: Joi.string().uuid().required(),
  templateId: Joi.string().required(),
  content: Joi.object().optional()
});

const updateCIMSchema = Joi.object({
  title: Joi.string().optional(),
  content: Joi.object().optional(),
  status: Joi.string().valid('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED').optional()
});

// Get all CIMs for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, companyId } = req.query;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(companyId && { companyId })
    };

    const cims = await prisma.cIM.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, industry: true }
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Parse JSON fields for SQLite
    const processedCims = cims.map(cim => ({
      ...cim,
      content: typeof cim.content === 'string' ? JSON.parse(cim.content) : cim.content,
      aiAnalysis: typeof cim.aiAnalysis === 'string' ? JSON.parse(cim.aiAnalysis) : cim.aiAnalysis
    }));

    const total = await prisma.cIM.count({ where });

    res.json({
      cims: processedCims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CIMs', message: error.message });
  }
});

// Get single CIM
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const cim = await prisma.cIM.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        company: true,
        reviews: {
          include: {
            reviewer: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          }
        }
      }
    });

    if (!cim) {
      return res.status(404).json({ error: 'CIM not found' });
    }

    // Parse JSON fields for SQLite
    cim.content = typeof cim.content === 'string' ? JSON.parse(cim.content) : cim.content;
    cim.aiAnalysis = typeof cim.aiAnalysis === 'string' ? JSON.parse(cim.aiAnalysis) : cim.aiAnalysis;

    res.json(cim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CIM', message: error.message });
  }
});

// Create new CIM
router.post('/',
  authenticateToken,
  validateRequest(createCIMSchema),
  async (req, res) => {
    try {
      const { title, companyId, templateId, content = {} } = req.body;

      // Verify company belongs to user
      const company = await prisma.company.findFirst({
        where: {
          id: companyId,
          userId: req.user.id
        }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const cim = await prisma.cIM.create({
        data: {
          title,
          companyId,
          userId: req.user.id,
          templateId,
          content: JSON.stringify(content),
          status: 'DRAFT'
        },
        include: {
          company: {
            select: { id: true, name: true, industry: true }
          }
        }
      });

      // Parse back for response
      cim.content = typeof cim.content === 'string' ? JSON.parse(cim.content) : cim.content;

      res.status(201).json(cim);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create CIM', message: error.message });
    }
  }
);

// Update CIM
router.put('/:id',
  authenticateToken,
  validateRequest(updateCIMSchema),
  async (req, res) => {
    try {
      const { title, content, status } = req.body;

      const existingCIM = await prisma.cIM.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!existingCIM) {
        return res.status(404).json({ error: 'CIM not found' });
      }

      const updatedCIM = await prisma.cIM.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }),
          ...(content && { content: JSON.stringify(content) }),
          ...(status && { status }),
          updatedAt: new Date()
        },
        include: {
          company: {
            select: { id: true, name: true, industry: true }
          }
        }
      });

      // Parse back for response
      updatedCIM.content = typeof updatedCIM.content === 'string' ? JSON.parse(updatedCIM.content) : updatedCIM.content;

      res.json(updatedCIM);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update CIM', message: error.message });
    }
  }
);

// Generate CIM with AI
router.post('/:id/generate',
  authenticateToken,
  async (req, res) => {
    try {
      const cim = await prisma.cIM.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          company: true
        }
      });

      if (!cim) {
        return res.status(404).json({ error: 'CIM not found' });
      }

      const { financialData, industryData, assumptions } = req.body;

      // Generate CIM content using AI service
      const generatedContent = await cimService.generateCIMContent({
        company: cim.company,
        financialData,
        industryData,
        assumptions,
        templateId: cim.templateId
      });

      // Update CIM with generated content
      const updatedCIM = await prisma.cIM.update({
        where: { id: req.params.id },
        data: {
          content: JSON.stringify(generatedContent.content),
          aiAnalysis: JSON.stringify(generatedContent.aiAnalysis),
          updatedAt: new Date()
        }
      });

      // Parse back
      updatedCIM.content = typeof updatedCIM.content === 'string' ? JSON.parse(updatedCIM.content) : updatedCIM.content;
      updatedCIM.aiAnalysis = typeof updatedCIM.aiAnalysis === 'string' ? JSON.parse(updatedCIM.aiAnalysis) : updatedCIM.aiAnalysis;

      res.json({
        success: true,
        cim: updatedCIM,
        generatedContent
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate CIM content',
        message: error.message
      });
    }
  }
);

// Export CIM as PDF
router.get('/:id/export',
  authenticateToken,
  async (req, res) => {
    try {
      const cim = await prisma.cIM.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: {
          company: true
        }
      });

      if (!cim) {
        return res.status(404).json({ error: 'CIM not found' });
      }

      // Parse JSON fields for SQLite
      cim.content = typeof cim.content === 'string' ? JSON.parse(cim.content) : cim.content;
      cim.aiAnalysis = typeof cim.aiAnalysis === 'string' ? JSON.parse(cim.aiAnalysis) : cim.aiAnalysis;

      const pdfBuffer = await cimService.exportToPDF(cim);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cim.title}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to export CIM',
        message: error.message
      });
    }
  }
);

// Delete CIM
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const cim = await prisma.cIM.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!cim) {
      return res.status(404).json({ error: 'CIM not found' });
    }

    await prisma.cIM.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'CIM deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete CIM', message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const prisma = new PrismaClient();

// Validation schemas
const createCompanySchema = Joi.object({
  name: Joi.string().required(),
  industry: Joi.string().required(),
  description: Joi.string().optional()
});

const updateCompanySchema = Joi.object({
  name: Joi.string().optional(),
  industry: Joi.string().optional(),
  description: Joi.string().optional()
});

// Get all companies for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { industry: { contains: search } }
        ]
      })
    };

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: { cims: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.company.count({ where });

    res.json({
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies', message: error.message });
  }
});

// Get single company
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        cims: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company', message: error.message });
  }
});

// Create new company
router.post('/',
  authenticateToken,
  validateRequest(createCompanySchema),
  async (req, res) => {
    try {
      const { name, industry, description } = req.body;

      const company = await prisma.company.create({
        data: {
          name,
          industry,
          description,
          userId: req.user.id
        }
      });

      res.status(201).json(company);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create company', message: error.message });
    }
  }
);

// Update company
router.put('/:id',
  authenticateToken,
  validateRequest(updateCompanySchema),
  async (req, res) => {
    try {
      const { name, industry, description } = req.body;

      const existingCompany = await prisma.company.findFirst({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!existingCompany) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const updatedCompany = await prisma.company.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(industry && { industry }),
          ...(description !== undefined && { description }),
          updatedAt: new Date()
        }
      });

      res.json(updatedCompany);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update company', message: error.message });
    }
  }
);

// Delete company
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await prisma.company.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete company', message: error.message });
  }
});

module.exports = router;
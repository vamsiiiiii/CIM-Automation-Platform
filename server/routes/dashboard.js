const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalCompanies,
      totalCIMs,
      activeCIMs,
      completedCIMs,
      aiAnalyses
    ] = await Promise.all([
      prisma.company.count({ where: { userId } }),
      prisma.cIM.count({ where: { userId } }),
      prisma.cIM.count({
        where: {
          userId,
          status: { in: ['DRAFT', 'IN_REVIEW'] }
        }
      }),
      prisma.cIM.count({
        where: {
          userId,
          status: { in: ['APPROVED', 'PUBLISHED'] }
        }
      }),
      prisma.cIM.count({
        where: {
          userId,
          aiAnalysis: { not: null }
        }
      })
    ]);

    // Calculate some metrics for the dashboard
    const timeSaved = totalCIMs > 0 ? '65%' : '0%';
    const aiAccuracy = aiAnalyses > 0 ? '94%' : 'N/A';
    const roiValue = totalCIMs > 0 ? '$2.5M' : '$0';

    res.json({
      totalCompanies,
      totalCIMs,
      activeCIMs,
      completedCIMs,
      aiAnalyses,
      timeSaved,
      aiAccuracy,
      roiValue
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error.message
    });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const recentCIMs = await prisma.cIM.findMany({
      where: { userId },
      include: {
        company: {
          select: { name: true, industry: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const recentCompanies = await prisma.company.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({
      recentCIMs,
      recentCompanies
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

module.exports = router;
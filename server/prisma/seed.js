const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Cleanup existing data to avoid duplicates/conflicts
  console.log('🧹 Cleaning up old data...');
  await prisma.review.deleteMany({});
  await prisma.cIM.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({ where: { email: 'demo@example.com' } });

  // 2. Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const demoUserId = 'b4a8131b-6ff7-4797-bf0b-d4ad0f008c56'; // Pinned UUID

  const user = await prisma.user.create({
    data: {
      id: demoUserId,
      email: 'demo@example.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'MANAGER'
    }
  });

  console.log('✅ Created demo user:', user.email);

  // 3. Define the 10 demo companies
  const companiesData = [
    { name: 'TechCorp AI', industry: 'AI & Technology', description: 'Enterprise AI solutions for predictive maintenance and industrial automation.' },
    { name: 'HealthTech Solutions', industry: 'Healthcare Tech', description: 'Next-generation patient management systems using blockchain.' },
    { name: 'GreenEnergy Systems', industry: 'Clean Energy', description: 'Smart grid management and renewable energy storage solutions.' },
    { name: 'FinTech Pro', industry: 'FinTech', description: 'Real-time payment processing and fraud detection for digital banking.' },
    { name: 'EduLearn Platform', industry: 'EdTech', description: 'Adaptive learning platforms for K-12 and professional development.' },
    { name: 'RetailSmart Analytics', industry: 'E-commerce', description: 'Customer behavior analysis and inventory optimization for retailers.' },
    { name: 'CyberGuard Security', industry: 'Cybersecurity', description: 'Automated threat detection and zero-trust architecture solutions.' },
    { name: 'CloudScale Infrastructure', industry: 'Cloud Services', description: 'Scalable cloud computing resources and edge computing services.' },
    { name: 'BioMed Innovations', industry: 'Biotechnology', description: 'Advanced drug discovery and genetic research tools.' },
    { name: 'AgriTech Solutions', industry: 'Agriculture', description: 'IoT-based precision farming and crop monitoring systems.' },
  ];

  // 4. Create companies and associated CIMs with financial data
  console.log('🚀 Seeding 10 companies and financial CIMs...');
  for (const comp of companiesData) {
    const company = await prisma.company.create({
      data: {
        ...comp,
        userId: user.id,
      },
    });

    // Generate balanced mock financial data for 2020-2024
    const baseRevenue = 10000000 + Math.random() * 5000000;
    const growthRate = 1.15 + Math.random() * 0.15; // 15-30% growth

    const revenue = [];
    let currentRev = baseRevenue;
    for (let i = 0; i < 5; i++) {
      revenue.push(Math.round(currentRev));
      currentRev *= growthRate;
    }

    const ebitdaMargin = 0.18 + Math.random() * 0.07; // 18-25% margin
    const ebitda = revenue.map(r => Math.round(r * ebitdaMargin));

    // Generate random accuracy scores for the chart
    const baseAccuracy = 92 + Math.floor(Math.random() * 6); // 92-98%

    await prisma.cIM.create({
      data: {
        title: `${company.name} - Investment Memorandum`,
        status: 'PUBLISHED',
        templateId: 'standard-cim',
        companyId: company.id,
        userId: user.id,
        content: JSON.stringify({
          metadata: {
            title: `${company.name} - Confidential Information Memorandum`,
            company: company.name,
            industry: company.industry,
            generatedAt: new Date().toISOString()
          },
          financialData: {
            years: [2020, 2021, 2022, 2023, 2024],
            revenue: revenue,
            ebitda: ebitda,
            netIncome: ebitda.map(e => Math.round(e * 0.72)),
            cashFlow: ebitda.map(e => Math.round(e * 0.85)),
          },
          sections: {
            executiveSummary: {
              title: 'Executive Summary',
              content: `${company.name} is a leading player in the ${company.industry} sector, demonstrating consistent growth and strong profitability over the last 5 years.`,
              order: 1
            }
          }
        }),
        aiAnalysis: JSON.stringify({
          growthAnalysis: `Consistent revenue growth at an average rate of ${((growthRate - 1) * 100).toFixed(1)}% annually.`,
          marketPosition: 'Strong competitive advantage through technical innovation.',
          cagr: `${((Math.pow(revenue[4] / revenue[0], 1 / 4) - 1) * 100).toFixed(1)}%`,
          accuracy: baseAccuracy,
          efficiency: 65 + Math.floor(Math.random() * 15),
          metrics: {
            financial: { accuracy: baseAccuracy, usage: 95 + Math.floor(Math.random() * 5) },
            market: { accuracy: baseAccuracy - (2 + Math.floor(Math.random() * 3)), usage: 85 + Math.floor(Math.random() * 10) },
            roi: { accuracy: baseAccuracy - (1 + Math.floor(Math.random() * 2)), usage: 90 + Math.floor(Math.random() * 8) },
            risk: { accuracy: baseAccuracy - (4 + Math.floor(Math.random() * 6)), usage: 80 + Math.floor(Math.random() * 15) }
          }
        })
      }
    });
    console.log(`✅ Seeded: ${company.name}`);
  }

  console.log('🎉 Database seeded successfully!');
  console.log('Demo Account: demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
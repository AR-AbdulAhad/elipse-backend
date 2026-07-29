const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

const seedFeaturedCaseStudies = async (req, res) => {
  try {
    const existing = await prisma.caseStudy.count({ where: { featured: true } });
    if (existing > 0) {
      return res.status(400).json({ message: `Already ${existing} featured case studies exist. Delete them first if you want to re-seed.` });
    }

    const seedPath = path.join(__dirname, '../../seed-data/featured-case-studies.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const items = JSON.parse(raw);

    let created = 0;
    for (const item of items) {
      const exists = await prisma.caseStudy.findUnique({ where: { slug: item.slug } });
      if (exists) continue;
      const maxPos = await prisma.caseStudy.aggregate({ _max: { position: true } });
      await prisma.caseStudy.create({
        data: {
          title: item.title,
          slug: item.slug,
          largeBanner: item.largeBanner,
          smallBanner: item.smallBanner,
          content: item.content,
          client: item.client || null,
          service: item.service || null,
          category: item.category || null,
          featured: true,
          position: (maxPos._max.position || 0) + 1,
        },
      });
      created++;
    }

    const all = await prisma.caseStudy.findMany({ where: { featured: true }, orderBy: { position: 'asc' } });
    res.status(201).json({ message: `Created ${created} featured case studies`, count: created, data: all });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { seedFeaturedCaseStudies };

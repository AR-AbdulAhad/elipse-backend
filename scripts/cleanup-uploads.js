const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const uploadsDir = path.resolve(__dirname, '../uploads');

// Normalize a stored path to the uploads relative form: /uploads/<type>/<file>
const normalizePath = (val) => {
  if (!val) return null;
  // Strip full URL origin if present
  let p = val.replace(/^https?:\/\/[^/]+/, '');
  // Ensure it starts with /uploads/
  if (!p.startsWith('/uploads/')) return null;
  return p;
};

async function cleanup() {
  console.log('=== Elipse Backend Cleanup Script ===\n');

  const referencedPaths = new Set();
  let totalRefs = 0;

  // Projects: check image, heroImage, heroVideo, video, sections images, gallery images
  const projects = await prisma.project.findMany();
  projects.forEach(p => {
    if (p.image) { const n = normalizePath(p.image); if (n) { referencedPaths.add(n); totalRefs++; } }
    if (p.heroImage) { const n = normalizePath(p.heroImage); if (n) { referencedPaths.add(n); totalRefs++; } }
    if (p.heroVideo) { const n = normalizePath(p.heroVideo); if (n) { referencedPaths.add(n); totalRefs++; } }
    if (p.video) { const n = normalizePath(p.video); if (n) { referencedPaths.add(n); totalRefs++; } }
    try {
      const sections = JSON.parse(p.sections || '[]');
      sections.forEach(s => { if (s.image) { const n = normalizePath(s.image); if (n) { referencedPaths.add(n); totalRefs++; } } });
    } catch {}
    try {
      const gallery = JSON.parse(p.galleryCategories || '[]');
      gallery.forEach(cat => {
        const imgs = typeof cat.images === 'string' ? cat.images.split(',').map(s => s.trim()) : (cat.images || []);
        imgs.forEach(img => { if (img) { const n = normalizePath(img); if (n) { referencedPaths.add(n); totalRefs++; } } });
      });
    } catch {}
  });
  console.log(`Projects: ${projects.length} found, ${totalRefs} total references captured`);

  // Case Studies: largeBanner, smallBanner
  const caseStudies = await prisma.caseStudy.findMany();
  caseStudies.forEach(cs => {
    if (cs.largeBanner) { const n = normalizePath(cs.largeBanner); if (n) { referencedPaths.add(n); totalRefs++; } }
    if (cs.smallBanner) { const n = normalizePath(cs.smallBanner); if (n) { referencedPaths.add(n); totalRefs++; } }
  });
  console.log(`Case Studies: ${caseStudies.length} found`);

  // Blogs: image, image2, image3, image4, video, video2, video3 + embedded in content
  const blogs = await prisma.blog.findMany();
  blogs.forEach(b => {
    ['image', 'image2', 'image3', 'image4', 'video', 'video2', 'video3'].forEach(f => {
      if (b[f]) { const n = normalizePath(b[f]); if (n) { referencedPaths.add(n); totalRefs++; } }
    });
    // Extract images from HTML content
    try {
      const content = b.content || '';
      const imgMatches = [...content.matchAll(/src=["']([^"']+)["']/g)];
      imgMatches.forEach(m => { const n = normalizePath(m[1]); if (n) { referencedPaths.add(n); totalRefs++; } });
    } catch {}
  });
  console.log(`Blogs: ${blogs.length} found`);

  // Reviews: video, image
  const reviews = await prisma.review.findMany();
  reviews.forEach(r => {
    if (r.video) { const n = normalizePath(r.video); if (n) { referencedPaths.add(n); totalRefs++; } }
    if (r.image) { const n = normalizePath(r.image); if (n) { referencedPaths.add(n); totalRefs++; } }
  });
  console.log(`Reviews: ${reviews.length} found`);

  console.log(`\nUnique referenced paths: ${referencedPaths.size}`);
  console.log('Sample referenced paths:', [...referencedPaths].slice(0, 5));

  // Scan all files in uploads/
  const uploadFolders = ['blogs', 'projects', 'case-studies', 'reviews', 'static'];
  let totalFiles = 0;
  let referencedCount = 0;
  let unusedCount = 0;
  const unusedList = [];
  const referencedFiles = [];

  for (const folder of uploadFolders) {
    const folderPath = path.join(uploadsDir, folder);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      totalFiles++;
      const relativePath = `/uploads/${folder}/${file}`;
      const absolutePath = path.join(folderPath, file);
      const stat = fs.statSync(absolutePath);

      if (referencedPaths.has(relativePath)) {
        referencedCount++;
        referencedFiles.push(relativePath);
      } else {
        unusedCount++;
        unusedList.push({ folder, file, path: relativePath, size: stat.size });
      }
    }
  }

  // Summary
  console.log('\n=== RESULTS ===');
  console.log(`Total files in uploads/:    ${totalFiles}`);
  console.log(`Referenced in database:     ${referencedCount}`);
  console.log(`Unused (not referenced):    ${unusedCount}`);
  console.log('');

  if (unusedCount === 0) {
    console.log('✅ No unused files found. Everything is clean!');
    console.log('Make sure to restart the backend server after cleanup.');
    await prisma.$disconnect();
    return;
  }

  // Sort by size (biggest first)
  unusedList.sort((a, b) => b.size - a.size);
  const totalSizeMB = (unusedList.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2);
  console.log(`Total unused size: ${totalSizeMB} MB\n`);

  console.log('Top 30 unused files:');
  unusedList.slice(0, 30).forEach(f => {
    const sizeMB = (f.size / 1024 / 1024).toFixed(2);
    console.log(`  [${f.folder}] ${f.file} (${sizeMB} MB)`);
  });

  if (unusedList.length > 30) {
    console.log(`  ... and ${unusedList.length - 30} more`);
  }

  if (process.argv.includes('--delete')) {
    console.log('\n--- DELETING UNUSED FILES ---');
    let deleted = 0;
    let freed = 0;
    for (const f of unusedList) {
      try {
        fs.unlinkSync(path.join(uploadsDir, f.folder, f.file));
        deleted++;
        freed += f.size;
      } catch (e) {
        console.log(`  FAILED: ${f.path} - ${e.message}`);
      }
    }
    const freedMB = (freed / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Deleted ${deleted} files, freed ${freedMB} MB`);
  } else {
    console.log('\n--- DRY RUN (no files deleted) ---');
    console.log('To delete unused files, run:');
    console.log('  node scripts/cleanup-uploads.js --delete');
  }

  await prisma.$disconnect();
}

cleanup().catch(e => {
  console.error('Cleanup failed:', e.message);
  process.exit(1);
});

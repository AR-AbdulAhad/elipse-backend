const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

const FRONTEND_ASSETS = path.join(__dirname, '../../../frontend/src/assets');
const STATIC_DIR = path.join(__dirname, '../../uploads/static');

const imageMappings = {
  '0.webp': 'ElipseImages/projects/0.webp',
  'Animation4.webp': 'ElipseImages/projects/Animation4.webp',
  'Qist-market.webp': 'ElipseImages/projects/Qist-market.webp',
  'VR1.webp': 'ElipseImages/projects/VR1.webp',
  'Artictecture.webp': 'ElipseImages/projects/Artictecture.webp',
  'BOAT-CONFIG-OPT.webp': 'ElipseImages/projects/BOAT-CONFIG-OPT.webp',
  'Animation2.webp': 'ElipseImages/projects/Animation2.webp',
  'Animation3.webp': 'ElipseImages/projects/Animation3.webp',
  'Animation.webp': 'ElipseImages/projects/Animation.webp',
  'AR.webp': 'ElipseImages/projects/AR.webp',
  'Animation7.webp': 'ElipseImages/projects/Animation7.webp',
  '2.webp': 'ElipseImages/projects/2.webp',
  'seat-2-1.webp': 'ElipseImages/projects/seat-2-1.webp',
  'Nawarco2.webp': 'ElipseImages/projects/Nawarco2.webp',
  'TOWEL.webp': 'ElipseImages/projects/TOWEL.webp',
  'Boat.webp': 'ElipseImages/projects/Boat.webp',
  'VR2.webp': 'ElipseImages/projects/VR2.webp',
  'VR3.webp': 'ElipseImages/projects/VR3.webp',
  'VR4.webp': 'ElipseImages/projects/VR4.webp',
  'VR5.webp': 'ElipseImages/projects/VR5.webp',
  'AR1.webp': 'ElipseImages/projects/AR1.webp',
  'AR2.webp': 'ElipseImages/projects/AR2.webp',
  'Artictecture2.webp': 'ElipseImages/projects/Artictecture2.webp',
  'Artictecture3.webp': 'ElipseImages/projects/Artictecture3.webp',
  'clubpro.webp': 'ElipseImages/projects/clubpro.webp',
  'housing-2.webp': 'ElipseImages/projects/housing-2.webp',
  '3601.webp': 'ElipseImages/projects/3601.webp',
  '3602.webp': 'ElipseImages/projects/3602.webp',
  '3604.webp': 'ElipseImages/projects/3604.webp',
  'costa.webp': 'ElipseImages/projects/costa.webp',
  'R-1.webp': 'ElipseImages/projects/R-1.webp',
  'malka-food (2).webp': 'ElipseImages/projects/malka-food (2).webp',
  'khoj-villas.webp': 'ElipseImages/projects/khoj-villas.webp',
  '15.jpg': 'ElipseImages/hero/15.jpg',
  'volve-configrator.webp': 'ElipseImages/hero/volve-configrator.webp',
  'Steering-1.png': 'ElipseImages/projects/Steering-1.png',
  'News1.webp': 'ElipseImages/projects/News1.webp',
  'elipse-artitecture.webp': 'ElipseImages/projects/elipse-artitecture.webp',
  'jetour.webp': 'ElipseImages/blogs/jetour.webp',
  'quest.3.webp': 'ElipseImages/blogs/quest.3.webp',
  'Ar.PNG': 'ElipseImages/blogs/Ar.PNG',
  'alnoor.webp': 'ElipseImages/blogs/alnoor.webp',
  'edu-1.webp': 'images/edu-1.webp',
  '1 (1).webp': 'images/1 (1).webp',
  'blogs-Ar.webp': 'ElipseImages/blogs/blogs-Ar.webp',
  'A (3) .webp': 'article-img/A (3) .webp',
  'A (5) .webp': 'article-img/A (5) .webp',
  'A (4) .webp': 'article-img/A (4) .webp',
  'A (6) .webp': 'article-img/A (6) .webp',
};

const staticProjects = [
  { title: 'Ahmed Food', category: 'Animation', path: '/project/ahmed-food', image: '15.jpg', video: 'Gabani.mp4' },
  { title: 'VOLVO CONFIGURATOR', category: 'Configurator', path: '/project/volvo-configurator', image: 'volve-configrator.webp', video: 'Volvo.mp4' },
  { title: 'STEERING CONFIGURATOR', category: 'Configurator', path: '/project/steering-configurator', image: 'Steering-1.png' },
  { title: 'Lahore Zoo', category: 'Animation', path: '/project/lahore-zoo', image: '0.webp', video: 'Khoj.mp4' },
  { title: 'Luxury Villa', category: 'Architecture', path: '/project/luxury-villa', image: 'VR1.webp', video: 'Vfx.mp4' },
  { title: 'MALKA FOOD', category: 'Animation', path: '/project/malka-food', image: 'malka-food (2).webp' },
  { title: 'ClubPro Web', category: 'Web', path: '/project/clubpro', image: 'clubpro.webp' },
  { title: 'COSTA CART', category: 'Configurator', path: '/project/costa-cart', image: 'costa.webp' },
  { title: 'Space Explorer VR', category: 'VR', path: '/project/space-explorer-vr', image: 'VR1.webp' },
  { title: 'Modern Complex', category: 'Architecture', path: '/project/modern-complex', image: 'Artictecture.webp' },
  { title: 'Retail AR', category: 'AR', path: '/project/retail-ar', image: 'AR.webp' },
  { title: 'VR Training', category: 'VR', path: '/project/vr-training', image: 'VR3.webp' },
  { title: 'BOAT CONFIGURATOR', category: 'Configurator', path: '/project/boat-configurator', image: 'BOAT-CONFIG-OPT.webp' },
  { title: 'ANAMORPHIC ANIMATION', category: 'Animation', path: '/project/anamorphic-animation', image: 'R-1.webp', video: 'Jam & Spread 15 Sec.mp4' },
  { title: 'Industrial Animation', category: 'Animation', path: '/project/industrial-animation', image: 'Animation7.webp' },
  { title: 'KHOJ VILLAS', category: 'Architecture', path: '/project/khoj-villas', image: 'khoj-villas.webp' },
  { title: 'KIA CONFIGURATOR', category: 'Configurator', path: '/project/kia-configurator', image: '2.webp' },
  { title: '3D Character Art', category: 'Animation', path: '/project/character-art', image: 'Animation4.webp' },
  { title: 'Virtual Museum', category: 'VR', path: '/project/virtual-museum', image: 'VR2.webp' },
  { title: 'AR Wayfinding', category: 'AR', path: '/project/wayfinding-ar', image: 'AR1.webp' },
  { title: 'Housing Society', category: 'Web', path: '/project/housing-society', image: 'housing-2.webp' },
  { title: 'SEAT CONFIGURATOR', category: 'Configurator', path: '/project/seat-configurator', image: 'seat-2-1.webp' },
  { title: 'GLUCO KAHANI', category: 'Animation', path: '/project/motion-graphics', image: 'Animation.webp' },
  { title: 'Modern Skyscraper', category: 'Architecture', path: '/project/modern-skyscraper', image: 'Artictecture2.webp' },
  { title: 'AR Furniture Viz', category: 'AR', path: '/project/furniture-viz-ar', image: 'AR2.webp' },
  { title: 'FRUIT CONFIGURATOR', category: 'Configurator', path: '/project/fruit-configurator', image: 'Nawarco2.webp' },
  { title: 'Architectural Walkthrough', category: 'Animation', path: '/project/arch-walkthrough', image: 'Animation2.webp' },
  { title: 'VR Simu-Lab', category: 'VR', path: '/project/vr-simu-lab', image: 'VR4.webp' },
  { title: 'Urban Planning', category: 'Architecture', path: '/project/urban-planning', image: 'Artictecture3.webp' },
  { title: 'OFFICE TOUR', category: 'Tour 360', path: 'https://elipsestudio.com/office-tour/', image: '3601.webp' },
  { title: 'TOWEL CONFIGURATOR', category: 'Configurator', path: '/project/towel-configurator', image: 'TOWEL.webp' },
  { title: 'Character Rigging', category: 'Animation', path: '/project/character-rigging', image: 'Animation3.webp' },
  { title: 'VR Real Estate', category: 'VR', path: '/project/vr-real-estate', image: 'VR5.webp' },
  { title: 'CHRISTMAS MARKET TOUR', category: 'Tour 360', path: 'https://elipsestudio.com/ChristmasMarket_360_Virtual_Tour/', image: '3602.webp' },
  { title: 'YACHT CONFIGURATOR', category: 'Configurator', path: '/project/yacht-configurator', image: 'Boat.webp' },
  { title: 'SCOTT 360 VIRTUAL TOUR', category: 'Tour 360', path: 'https://elipsestudio.com/scott-360-virtual-tour/', image: '3604.webp' },
  { title: 'Qistmarket', category: 'Web', path: '/project/qistmarket', image: 'Qist-market.webp' },
 ];

const staticReviews = [
  { clientName: 'Tim Barth', company: 'Company Name', video: 'Tim Barth.mp4' },
  { clientName: 'Hyper', company: 'Company Name', video: 'Hyper.mp4' },
  { clientName: 'Aviv', company: 'Company Name', video: 'Aviv.mp4' },
  { clientName: 'Ahmed', company: 'Company Name', video: 'Ahmed.mp4' },
  { clientName: 'Abel Cm Marketing', company: 'Company Name', video: 'Abel Cm Marketing.mp4' },
];

const REVIEW_ASSETS = path.join(FRONTEND_ASSETS, 'review');

const staticBlogs = [
  { title: 'Apparel Configurator for Fashion Brands in 2026: The Complete Guide', slug: 'apparel-configurator-fashion-brands-2026', category: 'Innovation', date: 'June 09, 2026', image: 'A (3) .webp', excerpt: 'Complete guide to apparel configurators for fashion brands in 2026.', content: '', video: 'Gabani.mp4' },
  { title: 'What Is Architectural Visualization? A Complete Guide for Property Developers', slug: 'architectural-visualization-guide', category: 'Real Estate', date: 'June 09, 2026', image: 'Artictecture.webp', excerpt: 'Complete guide to architectural visualization for property developers.', content: '', video: 'Volvo.mp4' },
  { title: 'Trusted VR Services Company for Custom Development in 2026', slug: 'vr-custom-development-2026', category: 'VR/AR', date: 'June 02, 2026', image: '1 (1).webp', excerpt: 'Trusted VR services company for custom development in 2026.', content: '', video: 'Khoj.mp4' },
  { title: 'Educational Animation Services for E-Learning Platforms in 2026', slug: 'educational-animation-2026', category: 'Education', date: 'June 02, 2026', image: 'edu-1.webp', excerpt: 'Educational animation services for e-learning platforms.', content: '' },
  { title: 'Configurator Solutions for Custom Furniture Brands in USA 2026', slug: 'furniture-configurator-2026', category: 'Innovation', date: 'May 11, 2026', image: 'alnoor.webp', excerpt: 'Configurator solutions for custom furniture brands in USA 2026.', content: '', video: 'Vfx.mp4' },
  { title: 'Why Animated Videos Boost Customer Engagement in 2026', slug: 'animated-videos-engagement', category: 'Marketing', date: 'May 11, 2026', image: 'Animation.webp', excerpt: 'Why animated videos boost customer engagement in 2026.', content: '', video: 'Jam & Spread 15 Sec.mp4' },
  { title: 'AR vs. VR vs. MR: Which Immersive Technology Will Transform Your Brand in 2026?', slug: 'immersive-tech-2026', category: 'Strategy', date: 'May 11, 2026', image: 'Ar.PNG', excerpt: 'AR vs. VR vs. MR comparison for brands in 2026.', content: '', video: 'TeenageGuy.mp4' },
  { title: 'How Virtual Reality Is Reshaping the Way We Work and Experience the World', slug: 'vr-reshaping-world', category: 'Innovation', date: 'May 05, 2026', image: 'quest.3.webp', excerpt: 'How VR is reshaping work and experiences.', content: '', video: 'Bombay 05 Sec.mp4' },
  { title: 'How Automotive Configurators Are Redefining the Car Buying Experience', slug: 'automotive-configurator', category: 'Automotive', date: 'May 08, 2026', image: 'volve-configrator.webp', excerpt: 'How automotive configurators redefine car buying.', content: '' },
  { title: 'What Is Immersive Experience Design and Why Brands Need It in 2026', slug: 'immersive-experience-design', category: 'Strategy', date: 'May 10, 2026', image: 'blogs-Ar.webp', excerpt: 'Immersive experience design and why brands need it.', content: '', video: 'Inverex.mp4' },
  { title: 'Book Professional Industrial Animation for Your Brand Today', slug: 'industrial-animation', category: 'Animation', date: 'May 06, 2026', image: 'Animation4.webp', excerpt: 'Book professional industrial animation for your brand.', content: '', video: 'mobile.webm' },
  { title: 'The Future of Interactive Product Customization', slug: 'web-based-configurator', category: 'Innovation', date: 'May 02, 2026', image: 'jetour.webp', excerpt: 'The future of interactive product customization.', content: '' },
  { title: 'What Is Immersive AR Marketing in 2026', slug: 'immersive-ar-marketing', category: 'AR/VR', date: 'May 04, 2026', image: 'AR.webp', excerpt: 'What is immersive AR marketing in 2026.', content: '', video: 'Zarrar_1.mp4' },
  { title: 'Elipse Studio Landing', slug: 'elipse-studio-landing', category: 'Design Inspiration', date: 'Jan 29, 2026', image: 'News1.webp', excerpt: 'Elipse Studio landing page.', content: '' },
  { title: 'Elipse Studio Architectures', slug: 'elipse-studio-architectures', category: 'Innovation', date: 'Dec 28, 2025', image: 'elipse-artitecture.webp', excerpt: 'Elipse Studio architectures showcase.', content: '' },
 ];

const copyImages = () => {
  if (!fs.existsSync(STATIC_DIR)) fs.mkdirSync(STATIC_DIR, { recursive: true });
  const copied = [];
  const uniqueFiles = [...new Set(Object.values(imageMappings))];
  for (const relPath of uniqueFiles) {
    const src = path.join(FRONTEND_ASSETS, relPath);
    const filename = path.basename(relPath);
    const dest = path.join(STATIC_DIR, filename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      copied.push(filename);
    }
  }
  // Copy review videos
  if (fs.existsSync(REVIEW_ASSETS)) {
    const reviewFiles = fs.readdirSync(REVIEW_ASSETS);
    for (const file of reviewFiles) {
      if (/\.(mp4|mov|avi|mkv|webm)$/i.test(file)) {
        const src = path.join(REVIEW_ASSETS, file);
        const dest = path.join(STATIC_DIR, file);
        if (fs.existsSync(src) && !fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          copied.push(file);
        }
      }
    }
  }
  return copied;
};

const BACKEND_ORIGIN = process.env.BACKEND_URL || '';

const seedStatic = async (req, res) => {
  try {
    const baseUrl = BACKEND_ORIGIN || `${req.protocol}://${req.get('host')}`;
    const copied = copyImages();

    let projectsCreated = 0;
    for (const p of staticProjects) {
      const exists = await prisma.project.findUnique({ where: { path: p.path } });
      if (exists) continue;
      const imgUrl = p.image ? `${baseUrl}/uploads/static/${p.image}` : '';
      const videoUrl = p.video ? `${baseUrl}/uploads/static/${p.video}` : '';
      await prisma.project.create({ data: { title: p.title, category: p.category, image: imgUrl, video: videoUrl, path: p.path } });
      projectsCreated++;
    }

    let blogsCreated = 0;
    for (const b of staticBlogs) {
      const exists = await prisma.blog.findUnique({ where: { slug: b.slug } });
      if (exists) continue;
      const imgUrl = b.image ? `${baseUrl}/uploads/static/${b.image}` : '';
      const videoUrl = b.video ? `${baseUrl}/uploads/static/${b.video}` : '';
      await prisma.blog.create({ data: { title: b.title, slug: b.slug, excerpt: b.excerpt, content: b.content, image: imgUrl, image2: b.image2 ? `${baseUrl}/uploads/static/${b.image2}` : '', image3: b.image3 ? `${baseUrl}/uploads/static/${b.image3}` : '', image4: b.image4 ? `${baseUrl}/uploads/static/${b.image4}` : '', video: videoUrl, video2: b.video2 ? `${baseUrl}/uploads/static/${b.video2}` : '', video3: b.video3 ? `${baseUrl}/uploads/static/${b.video3}` : '', category: b.category, date: b.date } });
      blogsCreated++;
    }

    let reviewsCreated = 0;
    for (const r of staticReviews) {
      const exists = await prisma.review.findFirst({ where: { clientName: r.clientName } });
      if (exists) continue;
      const videoUrl = `${baseUrl}/uploads/static/${r.video}`;
      await prisma.review.create({ data: { clientName: r.clientName, company: r.company, video: videoUrl } });
      reviewsCreated++;
    }

    res.json({
      success: true,
      imagesCopied: copied.length,
      projectsCreated,
      blogsCreated,
      reviewsCreated,
      message: `Seeded ${projectsCreated} projects, ${blogsCreated} blogs, ${reviewsCreated} reviews`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { seedStatic };

import fs from 'fs';
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function generateSitemap() {
  const baseUrl = 'https://luofilm.com'; // Replace with actual domain if known
  const staticPages = [
    '',
    '/movies',
    '/series',
    '/tv-channel',
    '/live-sport',
    '/agent',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  staticPages.forEach(page => {
    xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  try {
    // Add movies
    const moviesSnapshot = await getDocs(collection(db, 'movies'));
    moviesSnapshot.forEach(doc => {
      xml += `
  <url>
    <loc>${baseUrl}/watch/${doc.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add series
    const seriesSnapshot = await getDocs(collection(db, 'series'));
    seriesSnapshot.forEach(doc => {
      xml += `
  <url>
    <loc>${baseUrl}/watch/${doc.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add TV channels
    const tvSnapshot = await getDocs(collection(db, 'tvChannels'));
    tvSnapshot.forEach(doc => {
      xml += `
  <url>
    <loc>${baseUrl}/watch/${doc.id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

  } catch (error) {
    console.error('Error fetching data for sitemap:', error);
  }

  xml += `
</urlset>`;

  fs.writeFileSync('./public/sitemap.xml', xml);
  console.log('Sitemap generated successfully!');
}

generateSitemap();

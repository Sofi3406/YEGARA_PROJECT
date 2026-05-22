#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/database');
const mongoose = require('mongoose');
const Resource = require('../models/Resource');

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/checkResourceFile.js <resourceId>');
    process.exit(2);
  }

  await connectDB();

  const res = await Resource.findById(id).lean();
  if (!res) {
    console.error('Resource not found for id:', id);
    process.exit(3);
  }

  console.log('Resource:');
  console.log('  _id:', res._id.toString());
  console.log('  title:', res.title);
  console.log('  fileName:', res.fileName);
  console.log('  fileUrl:', res.fileUrl);
  console.log('  isPublic:', res.isPublic);

  const fileUrl = res.fileUrl || '';
  const candidates = [];

  // Normalize separators
  const normalized = fileUrl.replace(/\\/g, '/');
  candidates.push(normalized);

  // Strip any protocol+host (if fileUrl was stored as full URL)
  try {
    if (/^https?:\/\//i.test(normalized)) {
      const u = new URL(normalized);
      candidates.push(u.pathname);
      candidates.push(u.pathname.replace(/^\/+/, ''));
    }
  } catch (e) {}

  // Remove leading slashes
  candidates.push(normalized.replace(/^\/+/, ''));

  // Try resolving relative to backend root
  const backendRoot = path.resolve(__dirname, '..');
  candidates.push(path.resolve(backendRoot, normalized));
  candidates.push(path.resolve(backendRoot, normalized.replace(/^\/+/, '')));

  // Try under uploads folder by basename
  const base = path.basename(normalized);
  candidates.push(path.resolve(backendRoot, 'uploads', base));
  candidates.push(path.resolve(backendRoot, 'uploads', 'documents', base));
  candidates.push(path.resolve(backendRoot, 'uploads', 'images', base));

  // Deduplicate
  const uniq = [...new Set(candidates.filter(Boolean))];

  console.log('\nChecking candidate paths:');
  let found = null;
  for (const c of uniq) {
    const exists = fs.existsSync(c);
    console.log(`  - ${c} -> ${exists ? 'FOUND' : 'missing'}`);
    if (exists && !found) found = c;
  }

  if (found) {
    console.log('\nFOUND file at:', found);
    console.log('You can update the resource.fileUrl to a normalized relative path or leave as-is.');
    process.exit(0);
  }

  console.error('\nNo matching file found on disk for this resource.');
  console.error('Options: re-upload the file, restore from backup, or update the DB to point to an existing file.');
  process.exit(4);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

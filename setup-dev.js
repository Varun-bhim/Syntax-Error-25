#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Walrus Data Marketplace development environment...\n');

// Check if server directory exists
if (!fs.existsSync('server')) {
  console.error('❌ Server directory not found!');
  process.exit(1);
}

// Check if server package.json exists
if (!fs.existsSync('server/package.json')) {
  console.error('❌ Server package.json not found!');
  process.exit(1);
}

try {
  console.log('📦 Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n📦 Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
  
  console.log('\n✅ Setup complete!');
  console.log('\n🎯 Available commands:');
  console.log('  npm run dev        - Start both frontend and backend');
  console.log('  npm run client     - Start only frontend (React)');
  console.log('  npm run server     - Start only backend (Node.js)');
  console.log('  npm run install-all - Install all dependencies');
  
  console.log('\n🌐 URLs:');
  console.log('  Frontend: http://localhost:3000');
  console.log('  Backend:  http://localhost:5000');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

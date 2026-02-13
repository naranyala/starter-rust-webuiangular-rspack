#!/usr/bin/env bun

import fs from 'fs/promises';
import { execSync } from 'child_process';

async function buildFrontend() {
  console.log('Building frontend...');

  const originalDir = process.cwd();
  const frontendDir = './frontend';
  
  // Only change directory if we're not already in the frontend directory
  if (!process.cwd().endsWith('frontend')) {
    process.chdir(frontendDir);
  }

  try {
    // Install dependencies if needed
    console.log('Checking frontend dependencies...');
    try {
      await fs.access('node_modules');
      console.log('Frontend dependencies already installed.');
    } catch {
      console.log('Installing frontend dependencies...');
      execSync('bun install', { stdio: 'inherit' });
    }

    // Run rspack production build
    console.log('Running rspack production build...');
    execSync('bun run build:incremental', { stdio: 'inherit' });

    // Note: With Rspack, files are already in the correct location: dist/static/js and dist/static/css
    // No flattening needed as with the previous build system
    console.log('Rspack output is already in correct structure');

    // Determine the correct paths based on current directory
    const isFromRoot = !process.cwd().endsWith('frontend');
    const distPath = isFromRoot ? './frontend/dist' : './dist';
    const staticDestPath = isFromRoot ? './static' : '../static';

    // Read the generated index.html to find the injected script tag with hashed filename
    const generatedHtml = await fs.readFile(`${distPath}/index.html`, 'utf8');
    const scriptMatch = generatedHtml.match(/<script[^>]+src="([^"]+index\.[a-f0-9]+\.js)"/);
    const hashedJsFile = scriptMatch ? scriptMatch[1].split('/').pop() : null;
    console.log(`Rspack generated JS file: ${hashedJsFile}`);

    // Copy static files to root for WebUI server
    console.log('Copying static files to root...');
    await fs.mkdir(`${staticDestPath}/js`, { recursive: true });
    await fs.mkdir(`${staticDestPath}/css`, { recursive: true });

    // Copy JS files
    const distJsFiles = await fs.readdir(`${distPath}/static/js/`);
    for (const file of distJsFiles) {
      const srcPath = `${distPath}/static/js/${file}`;
      const destPath = `${staticDestPath}/js/${file}`;
      if ((await fs.stat(srcPath)).isFile()) {
        await fs.copyFile(srcPath, destPath);
        console.log(`  Copied to root: ${file}`);
      }
    }

    // If rspack injected a hashed filename, also create plain index.js
    if (hashedJsFile) {
      const hashedSrcPath = `${distPath}/static/js/${hashedJsFile}`;
      const plainDestPath = `${staticDestPath}/js/index.js`;
      await fs.copyFile(hashedSrcPath, plainDestPath);
      console.log(`  Created plain index.js (from ${hashedJsFile})`);
    }

    // Copy CSS files and also create plain index.css
    try {
      const rootCssFiles = await fs.readdir(`${distPath}/static/css/`);
      for (const file of rootCssFiles) {
        const srcPath = `${distPath}/static/css/${file}`;
        const destPath = `${staticDestPath}/css/${file}`;
        if ((await fs.stat(srcPath)).isFile()) {
          await fs.copyFile(srcPath, destPath);
          console.log(`  Copied to root: ${file}`);

          // Also copy main index CSS without hash
          if (file.startsWith('index.') && file.endsWith('.css')) {
            await fs.copyFile(srcPath, `${staticDestPath}/css/index.css`);
            console.log(`  Created plain index.css`);
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      console.log('No CSS files to copy.');
    }

    // Update index.html to use plain filenames
    console.log('Updating index.html paths...');
    let originalIndexHtml = await fs.readFile(`${distPath}/index.html`, 'utf8');

    // Update the title and class for the original content (separate for each target)
    let distIndexHtml = originalIndexHtml;
    distIndexHtml = distIndexHtml.replace(
      /<title>[^<]*<\/title>/,
      '<title>Rust WebUI Application</title>'
    );
    distIndexHtml = distIndexHtml.replace(
      /<div id="app"><\/div>/,
      '<div class="app"></div>'
    );
    // Change paths to ../static/ for dist location
    distIndexHtml = distIndexHtml.replace(
      /"(\.\/static\/)/g,
      '"../static/'
    );

    // Write updated index.html (for frontend/dist location with ../static paths)
    await fs.writeFile(`${distPath}/index.html`, distIndexHtml);
    
    // Create root index.html with correct paths (starting fresh from original)
    let rootIndexHtml = originalIndexHtml;
    rootIndexHtml = rootIndexHtml.replace(
      /<title>[^<]*<\/title>/,
      '<title>Rust WebUI Application</title>'
    );
    rootIndexHtml = rootIndexHtml.replace(
      /<div id="app"><\/div>/,
      '<div class="app"></div>'
    );
    // Use plain filenames (index.js, index.css) instead of hashed versions
    rootIndexHtml = rootIndexHtml.replace(
      /index\.[a-f0-9]+\.js/g,
      'index.js'
    );
    rootIndexHtml = rootIndexHtml.replace(
      /index\.[a-f0-9]+\.css/g,
      'index.css'
    );
    // Paths should already be ./static/ for root location, but ensure they are not ../static/
    rootIndexHtml = rootIndexHtml.replace(
      /"(\.\.\/static\/)/g,
      '"./static/'
    );

    // Write the root index.html with correct paths
    await fs.writeFile('../index.html', rootIndexHtml);
    console.log('Also created root index.html with correct paths');

    console.log('Frontend build completed successfully!');
    console.log('Output: frontend/dist/');
  } catch (error) {
    console.error('Error during frontend build:', error);
    process.exit(1);
  } finally {
    process.chdir(originalDir);
  }
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

buildFrontend();

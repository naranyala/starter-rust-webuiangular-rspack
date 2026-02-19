#!/usr/bin/env bun

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';

const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const QUIET = process.argv.includes('--quiet') || process.argv.includes('-q');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

class BuildLogger {
  constructor() {
    this.steps = [];
    this.currentStep = null;
    this.startTime = Date.now();
    this.warnings = [];
    this.errors = [];
  }

  get timestamp() {
    return new Date().toISOString();
  }

  log(level, message, meta = {}) {
    const entry = { timestamp: this.timestamp, level, message, meta };
    
    if (!QUIET) {
      const color = this.getLevelColor(level);
      const prefix = this.getLevelPrefix(level);
      console.log(`${color}${prefix}${colors.reset} ${message}`);
    }
  }

  getLevelColor(level) {
    const colorsByLevel = {
      DEBUG: colors.gray,
      INFO: colors.blue,
      WARN: colors.yellow,
      ERROR: colors.red,
      SUCCESS: colors.green,
      STEP: colors.cyan
    };
    return colorsByLevel[level] || colors.white;
  }

  getLevelPrefix(level) {
    const prefixes = {
      DEBUG: '[DEBUG]',
      INFO: '[INFO]',
      WARN: '[WARN]',
      ERROR: '[ERROR]',
      SUCCESS: '[✓]',
      STEP: '[STEP]'
    };
    return prefixes[level] || '[LOG]';
  }

  debug(message) { this.log('DEBUG', message); }
  info(message) { this.log('INFO', message); }
  warn(message) { this.log('WARN', message); }
  error(message) { this.log('ERROR', message); }
  success(message) { this.log('SUCCESS', message); }

  startStep(name, description = '') {
    const step = { name, description, startTime: Date.now(), status: 'running' };
    this.currentStep = step;
    this.steps.push(step);
    this.log('STEP', `Starting: ${name}${description ? ` - ${description}` : ''}`);
    return step;
  }

  stepLog(message, level = 'INFO') {
    if (this.currentStep) {
      if (level === 'WARN') this.warnings.push({ step: this.currentStep.name, message });
      if (level === 'ERROR') this.errors.push({ step: this.currentStep.name, message });
      this.log(level, `  ${message}`);
    }
  }

  endStep(success = true, error = null) {
    if (this.currentStep) {
      const duration = Date.now() - this.currentStep.startTime;
      this.currentStep.duration = duration;
      this.currentStep.status = success ? 'success' : 'failed';
      
      const statusText = success ? 'completed' : 'failed';
      if (success) {
        this.log('SUCCESS', `Finished: ${this.currentStep.name} (${duration}ms)`);
      } else {
        this.log('ERROR', `Failed: ${this.currentStep.name} - ${error?.message || 'Unknown error'}`);
      }
      this.currentStep = null;
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successfulSteps = this.steps.filter(s => s.status === 'success').length;
    const failedSteps = this.steps.filter(s => s.status === 'failed').length;

    console.log('\n' + colors.bright + '='.repeat(60) + colors.reset);
    console.log(colors.bright + 'BUILD SUMMARY' + colors.reset);
    console.log(colors.bright + '='.repeat(60) + colors.reset);
    console.log(`  Total Duration: ${totalDuration}ms`);
    console.log(`  Steps: ${successfulSteps} successful, ${failedSteps} failed, ${this.steps.length} total`);
    console.log(colors.bright + '='.repeat(60) + colors.reset + '\n');

    return { success: failedSteps === 0, totalDuration, steps: this.steps };
  }
}

const logger = new BuildLogger();

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function buildFrontend() {
  logger.info('Starting frontend build');

  const originalDir = process.cwd();
  const projectRoot = path.resolve(__dirname);
  const frontendDir = path.join(projectRoot, 'frontend');
  const distPath = path.join(frontendDir, 'dist');

  try {
    process.chdir(frontendDir);

    // Step 1: Install dependencies
    logger.startStep('dependencies', 'Installing frontend dependencies');
    try {
      await fs.access('node_modules');
      logger.stepLog('Dependencies already installed');
    } catch {
      logger.stepLog('Installing dependencies with bun...');
      execSync('bun install', { stdio: VERBOSE ? 'inherit' : 'pipe' });
      logger.stepLog('Dependencies installed');
    }
    logger.endStep(true);

    // Step 2: Build with Angular CLI
    logger.startStep('angular-build', 'Running Angular build');
    try {
      const buildStart = Date.now();
      execSync('bun run ng build', { stdio: VERBOSE ? 'inherit' : 'pipe', cwd: frontendDir });
      const buildDuration = Date.now() - buildStart;
      logger.stepLog(`Angular build completed in ${buildDuration}ms`);
    } catch (buildError) {
      logger.stepLog(`Build failed: ${buildError.message}`, 'ERROR');
      logger.endStep(false, buildError);
      throw buildError;
    }
    logger.endStep(true);

    // Step 3: Copy assets to project root dist/ and static/
    logger.startStep('copy-assets', 'Copying built assets');
    
    const rootDist = path.join(projectRoot, 'dist');
    const rootStatic = path.join(projectRoot, 'static');
    const rootStaticJs = path.join(rootStatic, 'js');
    const rootStaticCss = path.join(rootStatic, 'css');
    const angularOutputDir = path.join(frontendDir, 'dist', 'browser');
    const frontendStatic = path.join(frontendDir, 'dist', 'static');
    const distStaticJs = path.join(rootDist, 'static', 'js');
    const distStaticCss = path.join(rootDist, 'static', 'css');
    
    await fs.mkdir(distStaticJs, { recursive: true });
    await fs.mkdir(distStaticCss, { recursive: true });
    await fs.mkdir(rootStaticJs, { recursive: true });
    await fs.mkdir(rootStaticCss, { recursive: true });

    // Find JS files in Angular output (they have hashed names like main-XXXX.js)
    const mainJsFiles = (await fs.readdir(angularOutputDir)).filter(f => f.startsWith('main-') && f.endsWith('.js') && !f.endsWith('.map'));
    const winboxJsFiles = (await fs.readdir(angularOutputDir)).filter(f => f.startsWith('winbox.') && f.endsWith('.js') && !f.endsWith('.map'));

    if (mainJsFiles.length === 0) {
      throw new Error('No main JS file found in Angular output');
    }

    const mainJsFile = mainJsFiles[0];
    const winboxJsFile = winboxJsFiles.length > 0 ? winboxJsFiles[0] : null;

    // Copy main JS file
    const mainSrc = path.join(angularOutputDir, mainJsFile);
    const mainDestJs = path.join(distStaticJs, 'main.js');
    const mainDestRootJs = path.join(rootStaticJs, 'main.js');
    await fs.copyFile(mainSrc, mainDestJs);
    await fs.copyFile(mainSrc, mainDestRootJs);
    logger.stepLog(`Copied ${mainJsFile} as main.js`);

    // Copy winbox JS file
    if (winboxJsFile) {
      const winboxSrc = path.join(angularOutputDir, winboxJsFile);
      const winboxDestJs = path.join(distStaticJs, 'winbox.min.js');
      const winboxDestRootJs = path.join(rootStaticJs, 'winbox.min.js');
      await fs.copyFile(winboxSrc, winboxDestJs);
      await fs.copyFile(winboxSrc, winboxDestRootJs);
      logger.stepLog(`Copied ${winboxJsFile} as winbox.min.js`);
    }
    
    // Copy chunk files (numbered JS files like 319.xxxx.js, 427.xxxx.js, etc.)
    const chunkFiles = (await fs.readdir(angularOutputDir)).filter(
      f => /^\d+\.[a-f0-9]+\.js$/.test(f) && !f.endsWith('.map')
    );
    
    for (const chunkFile of chunkFiles) {
      const src = path.join(angularOutputDir, chunkFile);
      await fs.copyFile(src, path.join(distStaticJs, chunkFile));
      await fs.copyFile(src, path.join(rootStaticJs, chunkFile));
    }
    if (chunkFiles.length > 0) {
      logger.stepLog(`Copied ${chunkFiles.length} chunk files`);
    }
    
    // Note: CSS is bundled into JS by Angular, so no separate CSS file to copy
    
    // Step 4a: Copy winbox.min.js from node_modules
    logger.startStep('copy-winbox', 'Copying WinBox');
    const winboxSrc = path.join(frontendDir, 'node_modules', 'winbox', 'dist', 'winbox.bundle.min.js');
    const winboxDest1 = path.join(rootStaticJs, 'winbox.min.js');
    const winboxDest2 = path.join(distStaticJs, 'winbox.min.js');
    if (await pathExists(winboxSrc)) {
      await fs.copyFile(winboxSrc, winboxDest1);
      await fs.copyFile(winboxSrc, winboxDest2);
      logger.stepLog('Copied winbox.min.js');
    } else {
      logger.stepLog('Warning: winbox.min.js not found', 'WARN');
    }
    logger.endStep(true);

    // Step 4b: Copy webui.js
    logger.startStep('copy-webui', 'Copying WebUI bridge');
    const webuiSrc = path.join(projectRoot, 'thirdparty', 'webui-c-src', 'bridge', 'webui.js');
    const webuiDest = path.join(rootStaticJs, 'webui.js');
    if (await pathExists(webuiSrc)) {
      await fs.copyFile(webuiSrc, webuiDest);
      await fs.copyFile(webuiSrc, path.join(distStaticJs, 'webui.js'));
      logger.stepLog('Copied webui.js');
    } else {
      logger.stepLog('Warning: webui.js not found at ' + webuiSrc, 'WARN');
    }
    logger.endStep(true);

    // Step 5: Create index.html
    logger.startStep('update-html', 'Creating dist/index.html');
    
    const rootIndexHtml = path.join(rootDist, 'index.html');
    
    // Create a minimal host page for Angular app shell
    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Rust WebUI Application</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>

  <script src="./static/js/winbox.min.js"></script>
  <script src="./static/js/webui.js"></script>
  <script src="./static/js/main.js"></script>
</body>
</html>`;
    
    await fs.writeFile(rootIndexHtml, htmlContent);
    logger.stepLog('Created dist/index.html');
    logger.endStep(true);

    logger.success('Frontend build completed!');
    logger.printSummary();

  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    logger.printSummary();
    process.exitCode = 1;
  } finally {
    process.chdir(originalDir);
  }
}

buildFrontend();

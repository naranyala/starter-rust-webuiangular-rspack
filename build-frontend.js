#!/usr/bin/env bun

import fs from 'fs/promises';
import { execSync, spawn } from 'child_process';
import path from 'path';

const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const QUIET = process.argv.includes('--quiet') || process.argv.includes('-q');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

class BuildLogger {
  constructor() {
    this.steps = [];
    this.currentStep = null;
    this.startTime = Date.now();
    this.warnings = [];
    this.errors = [];
    this.logs = [];
  }

  get timestamp() {
    return new Date().toISOString();
  }

  log(level, message, meta = {}) {
    const entry = { timestamp: this.timestamp, level, message, meta };
    this.logs.push(entry);
    
    if (!QUIET) {
      const color = this.getLevelColor(level);
      const prefix = this.getLevelPrefix(level);
      console.log(`${color}${prefix}${colors.reset} ${message}`);
      if (VERBOSE && Object.keys(meta).length > 0) {
        console.log(`  ${colors.gray}${JSON.stringify(meta)}${colors.reset}`);
      }
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

  debug(message, meta = {}) { this.log('DEBUG', message, meta); }
  info(message, meta = {}) { this.log('INFO', message, meta); }
  warn(message, meta = {}) { this.log('WARN', message, meta); }
  error(message, meta = {}) { this.log('ERROR', message, meta); }
  success(message, meta = {}) { this.log('SUCCESS', message, meta); }

  startStep(name, description = '') {
    const step = {
      name,
      description,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'running',
      logs: [],
      warnings: [],
      errors: []
    };
    this.currentStep = step;
    this.steps.push(step);
    this.log('STEP', `Starting: ${name}${description ? ` - ${description}` : ''}`, { step: name });
    return step;
  }

  stepLog(message, level = 'INFO') {
    if (this.currentStep) {
      const entry = { timestamp: Date.now(), level, message };
      this.currentStep.logs.push(entry);
      
      if (level === 'WARN') this.warnings.push({ step: this.currentStep.name, message });
      if (level === 'ERROR') this.errors.push({ step: this.currentStep.name, message });
      
      this.log(level, `  ${message}`);
    }
  }

  endStep(success = true, error = null) {
    if (this.currentStep) {
      this.currentStep.endTime = Date.now();
      this.currentStep.duration = this.currentStep.endTime - this.currentStep.startTime;
      this.currentStep.status = success ? 'success' : 'failed';
      
      const statusText = success ? 'completed' : 'failed';
      const duration = this.formatDuration(this.currentStep.duration);
      const meta = { step: this.currentStep.name, duration: this.currentStep.duration };
      
      if (success) {
        this.log('SUCCESS', `Finished: ${this.currentStep.name} (${duration})`, meta);
      } else {
        this.log('ERROR', `Failed: ${this.currentStep.name} - ${error?.message || 'Unknown error'}`, meta);
      }
      
      this.currentStep = null;
    }
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successfulSteps = this.steps.filter(s => s.status === 'success').length;
    const failedSteps = this.steps.filter(s => s.status === 'failed').length;
    const totalWarnings = this.warnings.length;
    const totalErrors = this.errors.length;

    console.log('\n' + colors.bright + '='.repeat(60) + colors.reset);
    console.log(colors.bright + 'BUILD SUMMARY' + colors.reset);
    console.log(colors.bright + '='.repeat(60) + colors.reset);
    console.log(`  Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`  Steps: ${successfulSteps} successful, ${failedSteps} failed, ${this.steps.length} total`);
    console.log(`  Warnings: ${totalWarnings}`);
    console.log(`  Errors: ${totalErrors}`);
    
    if (VERBOSE) {
      console.log('\n' + colors.dim + 'Step Details:' + colors.reset);
      this.steps.forEach(step => {
        const statusColor = step.status === 'success' ? colors.green : colors.red;
        const icon = step.status === 'success' ? '✓' : '✗';
        console.log(`  ${statusColor}${icon}${colors.reset} ${step.name}: ${this.formatDuration(step.duration)}`);
      });
    }

    if (this.warnings.length > 0 && !QUIET) {
      console.log('\n' + colors.yellow + 'Warnings:' + colors.reset);
      this.warnings.forEach(w => console.log(`  ${colors.yellow}!${colors.reset} [${w.step}] ${w.message}`));
    }

    if (this.errors.length > 0) {
      console.log('\n' + colors.red + 'Errors:' + colors.reset);
      this.errors.forEach(e => console.log(`  ${colors.red}x${colors.reset} [${e.step}] ${e.message}`));
    }

    console.log(colors.bright + '='.repeat(60) + colors.reset + '\n');

    return {
      success: failedSteps === 0,
      totalDuration,
      steps: this.steps,
      warnings: this.warnings,
      errors: this.errors
    };
  }

  exportLogs(format = 'json') {
    const data = {
      timestamp: this.timestamp,
      totalDuration: Date.now() - this.startTime,
      steps: this.steps,
      warnings: this.warnings,
      errors: this.errors,
      logs: this.logs
    };

    if (format === 'json') return JSON.stringify(data, null, 2);
    
    if (format === 'text') {
      let text = `Build Log - ${this.timestamp}\n${'='.repeat(60)}\n\n`;
      this.steps.forEach(step => {
        text += `[${step.status.toUpperCase()}] ${step.name} (${step.duration}ms)\n`;
        step.logs.forEach(l => text += `  ${l.level}: ${l.message}\n`);
        text += '\n';
      });
      return text;
    }
    
    return JSON.stringify(data);
  }

  saveLogs(filename = 'build.log') {
    fs.writeFile(filename, this.exportLogs('json'));
  }
}

const logger = new BuildLogger();

async function buildWebUI() {
  logger.startStep('webui-build', 'Building WebUI bridge library');
  
  const originalDir = process.cwd();
  const projectRoot = path.resolve(__dirname);
  const bridgeDir = path.join(projectRoot, 'thirdparty/webui-c-src/bridge');
  const staticJsPath = path.join(projectRoot, 'static/js');
  
  try {
    await fs.mkdir(staticJsPath, { recursive: true });
    
    logger.stepLog('Checking for esbuild...');
    try {
      execSync('esbuild --version', { stdio: 'pipe' });
    } catch {
      logger.stepLog('Installing esbuild globally...');
      execSync('npm install -g esbuild', { stdio: VERBOSE ? 'inherit' : 'pipe' });
    }
    
    logger.stepLog('Transpiling webui.ts to webui.js...');
    execSync(
      `esbuild --bundle --target="chrome90,firefox90,safari15" --format=esm --tree-shaking=false --minify-syntax --minify-whitespace --outfile="${staticJsPath}/webui.js" "${bridgeDir}/webui.ts"`,
      { stdio: VERBOSE ? 'inherit' : 'pipe' }
    );
    
    logger.stepLog('Created static/js/webui.js');
    logger.endStep(true);
    
  } catch (error) {
    logger.stepLog(`Failed to build webui.js: ${error.message}`, 'ERROR');
    logger.endStep(false, error);
    throw error;
  } finally {
    process.chdir(originalDir);
  }
}

async function patchIndexHtml() {
  logger.startStep('patch-index', 'Patching index.html with webui.js');
  
  const originalDir = process.cwd();
  const projectRoot = path.resolve(__dirname);
  const rootIndexHtml = path.join(projectRoot, 'index.html');
  const distIndexHtml = path.join(projectRoot, 'frontend/dist/index.html');
  
  try {
    const htmlContent = await fs.readFile(rootIndexHtml, 'utf8');
    
    const hasWebuiScript = htmlContent.includes('webui.js');
    
    if (!hasWebuiScript) {
      logger.stepLog('Adding webui.js script tag to index.html');
      
      const patchedHtml = htmlContent.replace(
        '</body>',
        '  <script src="./static/js/webui.js"></script>\n</body>'
      );
      
      await fs.writeFile(rootIndexHtml, patchedHtml);
      logger.stepLog('Patched root index.html with webui.js');
      
      if (await pathExists(distIndexHtml)) {
        const distHtml = await fs.readFile(distIndexHtml, 'utf8');
        const patchedDistHtml = distHtml.replace(
          '</body>',
          '  <script src="../static/js/webui.js"></script>\n</body>'
        );
        await fs.writeFile(distIndexHtml, patchedDistHtml);
        logger.stepLog('Patched dist/index.html with webui.js');
      }
    } else {
      logger.stepLog('webui.js already present in index.html');
    }
    
    logger.endStep(true);
    
  } catch (error) {
    logger.stepLog(`Failed to patch index.html: ${error.message}`, 'ERROR');
    logger.endStep(false, error);
    throw error;
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

async function buildFrontend() {
  logger.info('Starting frontend build pipeline', { 
    version: '2.0',
    verbose: VERBOSE,
    quiet: QUIET,
    timestamp: logger.timestamp 
  });

  const originalDir = process.cwd();
  const frontendDir = './frontend';
  const isFromRoot = !process.cwd().endsWith('frontend');
  
  // Set initial paths
  let distPath = isFromRoot ? './frontend/dist' : './dist';
  let staticDestPath = isFromRoot ? './static' : '../static';

  if (isFromRoot) {
    process.chdir(frontendDir);
    // After chdir to frontend, adjust paths
    distPath = './dist';
    staticDestPath = '../static';
  }

  try {
    const step = logger.startStep('dependencies', 'Installing frontend dependencies');
    
    try {
      await fs.access('node_modules');
      logger.stepLog('Dependencies already installed');
    } catch {
      logger.stepLog('Installing dependencies with bun...');
      try {
        execSync('bun install', { stdio: VERBOSE ? 'inherit' : 'pipe' });
        logger.stepLog('Dependencies installed successfully');
      } catch (installError) {
        logger.stepLog(`Failed to install dependencies: ${installError.message}`, 'ERROR');
        throw new Error(`Dependency installation failed: ${installError.message}`);
      }
    }
    logger.endStep(true);

    logger.startStep('rspack-build', 'Running Rspack production build');
    logger.stepLog('Executing rspack build...');
    
    try {
      const buildStart = Date.now();
      execSync('bun run build:incremental', { 
        stdio: VERBOSE ? 'inherit' : 'pipe'
      });
      const buildDuration = Date.now() - buildStart;
      logger.stepLog(`Rspack build completed in ${logger.formatDuration(buildDuration)}`);
    } catch (buildError) {
      logger.stepLog(`Build failed: ${buildError.message}`, 'ERROR');
      if (buildError.stdout) logger.stepLog(`stdout: ${buildError.stdout.toString()}`, 'DEBUG');
      if (buildError.stderr) logger.stepLog(`stderr: ${buildError.stderr.toString()}`, 'ERROR');
      logger.endStep(false, buildError);
      throw buildError;
    }
    logger.endStep(true);

    logger.startStep('copy-assets', 'Copying static assets to dist directory');

    // Create dist directory structure
    const distRoot = path.join(projectRoot, 'dist');
    const distStaticJs = path.join(distRoot, 'static', 'js');
    const distStaticCss = path.join(distRoot, 'static', 'css');
    
    await fs.mkdir(distStaticJs, { recursive: true });
    await fs.mkdir(distStaticCss, { recursive: true });
    logger.stepLog(`Created directories: dist/static/js, dist/static/css`);

    const jsFiles = await fs.readdir(`${distPath}/static/js/`);
    let jsCount = 0;
    for (const file of jsFiles) {
      const srcPath = `${distPath}/static/js/${file}`;
      if ((await fs.stat(srcPath)).isFile()) {
        await fs.copyFile(srcPath, path.join(distStaticJs, file));
        jsCount++;
      }
    }
    logger.stepLog(`Copied ${jsCount} JS files to dist/static/js/`);

    const generatedHtml = await fs.readFile(`${distPath}/index.html`, 'utf8');
    const scriptMatch = generatedHtml.match(/<script[^>]+src="([^"]+index\.[a-f0-9]+\.js)"/);
    const hashedJsFile = scriptMatch ? scriptMatch[1].split('/').pop() : null;

    if (hashedJsFile) {
      await fs.copyFile(
        `${distPath}/static/js/${hashedJsFile}`,
        path.join(distStaticJs, 'index.js')
      );
      logger.stepLog(`Created dist/static/js/index.js (from ${hashedJsFile})`);
    }

    let cssCount = 0;
    try {
      const cssFiles = await fs.readdir(`${distPath}/static/css/`);
      for (const file of cssFiles) {
        const srcPath = `${distPath}/static/css/${file}`;
        if ((await fs.stat(srcPath)).isFile()) {
          await fs.copyFile(srcPath, path.join(distStaticCss, file));
          cssCount++;

          if (file.startsWith('index.') && file.endsWith('.css')) {
            await fs.copyFile(srcPath, path.join(distStaticCss, 'index.css'));
            logger.stepLog(`Created dist/static/css/index.css`);
          }
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      logger.stepLog('No CSS files to copy', 'DEBUG');
    }
    logger.stepLog(`Copied ${cssCount} CSS files to dist/static/css/`);
    logger.endStep(true);

    await buildWebUI();

    await patchIndexHtml();

    logger.startStep('update-index', 'Creating dist/index.html with correct paths');

    let originalIndexHtml = await fs.readFile(`${distPath}/index.html`, 'utf8');

    // Create dist/index.html with paths pointing to ../static/
    let distIndexHtml = originalIndexHtml
      .replace(/<title>[^<]*<\/title>/, '<title>Rust WebUI Application</title>')
      .replace(/<div id="app"><\/div>/, '<div class="app"></div>')
      .replace(/"(\.\/static\/)/g, '"../static/');

    await fs.writeFile(path.join(distRoot, 'index.html'), distIndexHtml);
    logger.stepLog('Created dist/index.html with relative paths');

    // Also update root index.html for development (paths to ./static/)
    let rootIndexHtml = originalIndexHtml
      .replace(/<title>[^<]*<\/title>/, '<title>Rust WebUI Application</title>')
      .replace(/<div id="app"><\/div>/, '<div class="app"></div>')
      .replace(/index\.[a-f0-9]+\.js/g, 'index.js')
      .replace(/index\.[a-f0-9]+\.css/g, 'index.css')
      .replace(/"(\.\.\/static\/)/g, '" ./static/');

    await fs.writeFile('../index.html', rootIndexHtml);
    logger.stepLog('Created root index.html for development');
    logger.endStep(true);

    logger.success('Frontend build completed successfully!', {
      output: 'dist/',
      assets: { js: jsCount, css: cssCount }
    });

  } catch (error) {
    logger.error(`Build failed: ${error.message}`, { 
      stack: error.stack,
      step: logger.currentStep?.name 
    });
    console.error('\n' + colors.red + 'BUILD FAILED' + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    process.exitCode = 1;
  } finally {
    process.chdir(originalDir);
    const summary = logger.printSummary();
    
    if (process.argv.includes('--save-logs')) {
      logger.saveLogs(`build-${Date.now()}.log`);
      logger.info('Build logs saved');
    }
  }

  return process.exitCode;
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

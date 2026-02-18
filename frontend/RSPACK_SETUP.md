# Angular + Rspack + Bun Setup

This project demonstrates Angular 19 working with the Rspack bundler and Bun JavaScript runtime.

## Quick Start

### Development Server
```bash
bun run serve:rspack
# or
bun run dev
```

### Production Build
```bash
bun run build:rspack
```

### Traditional Angular CLI (Webpack)
```bash
bun run start    # Angular CLI dev server
bun run build    # Angular CLI production build
```

## Configuration Files

- `rspack.config.js` - Rspack bundler configuration
- `bunfig.toml` - Bun runtime configuration  
- `tsconfig.json` - TypeScript configuration for Angular 19

## Key Dependencies

- **Angular 19.2** - Latest Angular framework
- **Rspack 1.7** - Fast Rust-based bundler
- **Bun 1.3** - Fast JavaScript runtime and package manager
- **esbuild-loader** - Fast TypeScript compilation

## How It Works

This setup uses a manual Rspack configuration that:
1. Uses `esbuild-loader` to compile TypeScript with Angular decorators
2. Loads HTML templates with `raw-loader`
3. Processes CSS/SCSS with standard loaders
4. Generates HTML with `html-rspack-plugin`
5. Runs entirely on Bun runtime for maximum performance

## Notes

- The bundle size is large (~820KB) because it includes the full Angular runtime
- For production, consider enabling production mode and lazy loading
- HMR (Hot Module Replacement) works with `bun run dev`
- The Okta authentication is configured but may need adjustment for your environment

## Troubleshooting

If you encounter issues:
1. Clean install: `rm -rf node_modules && bun install`
2. Clear cache: `rm -rf dist && bun run build:rspack`
3. Check Bun version: `bun --version` (should be 1.3+)

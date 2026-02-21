# Biome Linter & Formatter Setup Guide

This project uses **Biome** (v2.4.4+) for linting and formatting. Biome is a fast, all-in-one tool that replaces ESLint, Prettier, and other tools.

## 🚀 Quick Start

```bash
# Check for issues (recommended first step)
bun run lint

# Automatically fix issues
bun run lint:fix

# Check formatting
bun run format:check

# Fix formatting
bun run format:fix

# Run both check and format
bun run check

# Fix both lint and format
bun run check:fix
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `bun run lint` | Check for lint errors |
| `bun run lint:fix` | Auto-fix lint errors |
| `bun run lint:ci` | CI-friendly lint (max 100 diagnostics) |
| `bun run lint:staged` | Lint staged files (for git hooks) |
| `bun run format` | Check formatting |
| `bun run format:fix` | Auto-fix formatting |
| `bun run format:check` | Check formatting (CI mode) |
| `bun run check` | Run both lint and format check |
| `bun run check:fix` | Run both lint and format fix |

## ⚙️ Configuration

The configuration is in [`biome.json`](./biome.json). Key features:

### Angular-Specific Settings

- **Decorators**: Enabled for Angular decorators
- **Interpolation**: Enabled for Angular templates
- **Strict null checks**: Warnings for non-null assertions
- **Any type**: Allowed (common in Angular)

### Code Style

- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Single quotes for JS/TS, double for HTML/JSON
- **Semicolons**: Always required
- **Trailing commas**: ES5 style (objects/arrays, not functions)

### Rules Highlights

#### Enabled (Error)
- No unused imports/variables
- No unreachable code
- No const enum
- Use optional chaining
- Use template literals
- Use array literals

#### Enabled (Warning)
- No console (allows: warn, error, info)
- No array index keys
- No non-null assertion
- No empty blocks
- No accumulating spread

#### Disabled (Angular compatibility)
- `noForEach` - Angular code often uses forEach
- `noExplicitAny` - Sometimes necessary in Angular
- `noParameterAssign` - Common pattern in Angular

## 📁 File Coverage

Biome checks:
- ✅ TypeScript (`.ts`)
- ✅ JavaScript (`.js`, `.mjs`)
- ✅ HTML (`.html`) - including Angular templates
- ✅ CSS/SCSS (`.css`, `.scss`)
- ✅ JSON (`.json`)

Ignored folders:
- `node_modules/`
- `dist/`
- `build/`
- `.angular/`
- `out-tsc/`
- `target/`
- `e2e/` (has separate config)

## 🔧 VS Code Integration

Install the **Biome** extension:

```
biomejs.biome
```

Then add to your `.vscode/settings.json`:

```json
{
  "biome.enabled": true,
  "biome.lint.enabled": true,
  "biome.format.enabled": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[html]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[css]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnSave": true
  }
}
```

## 🎯 Common Issues & Fixes

### Unused Imports
```typescript
// ❌ Before
import { isErr, isOk, unusedFunc } from './utils';

// ✅ After
import { isOk } from './utils';
```

### Console Usage
```typescript
// ❌ Before
console.log('Debug message');

// ✅ After (use logger)
logger.info('Debug message');
// Or allow console.warn/error
console.warn('Warning message');
```

### Non-null Assertion
```typescript
// ❌ Before (warning)
const value = element!.value;

// ✅ After
const value = element?.value ?? '';
```

### Optional Chaining
```typescript
// ❌ Before
if (obj && obj.prop && obj.prop.value) {
  // ...
}

// ✅ After
if (obj?.prop?.value) {
  // ...
}
```

## 🚦 CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Lint
  run: bun run lint:ci

- name: Format Check
  run: bun run format:check
```

## 📝 Git Hooks (Optional)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
cd frontend
bun run lint:staged
bun run format:fix
```

Or use [Husky](https://typicode.github.io/husky/) with `lint-staged`.

## 🐛 Troubleshooting

### "Biome couldn't find an ignore file"
The project uses explicit `includes` in `biome.json` instead of `.biomeignore`.

### "Unknown key" errors
Ensure you're using Biome v2.4.4+. Run:
```bash
bun x biome --version
```

### Angular template errors
Biome supports Angular interpolation. If you see errors, ensure:
```json
{
  "html": {
    "parser": {
      "interpolation": true
    }
  }
}
```

## 📚 Resources

- [Biome Documentation](https://biomejs.dev/)
- [Biome Rules](https://biomejs.dev/linter/rules/)
- [Angular Best Practices](https://angular.dev/guide/styleguide)

## 🔄 Migration from ESLint/Prettier

If migrating from ESLint/Prettier:

1. Remove ESLint/Prettier dependencies
2. Remove `.eslintrc`, `.prettierrc`
3. Add `biome.json` (this project's config is a good template)
4. Update scripts in `package.json`
5. Run `bun run check:fix` to auto-fix

---

**Last Updated**: February 2026  
**Biome Version**: 2.4.4+  
**Angular Version**: 21.1.5+

## ✅ Current Status

All linting issues have been resolved:
- ✅ No unused imports
- ✅ No console warnings (except allowed ones)
- ✅ Proper button types in HTML
- ✅ Correct forEach callback usage
- ✅ All files properly formatted

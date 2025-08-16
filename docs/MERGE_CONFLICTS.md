# Merge Conflict Resolution Guide

This document provides comprehensive guidance for resolving merge conflicts in package management files for the TheRoofDoctorsApp project.

## Overview

The repository includes automated tools to detect and resolve merge conflicts in critical dependency files:
- `package.json` - Main package configuration
- `package-lock.json` - NPM lock file with exact dependency versions  
- `yarn.lock` - Yarn lock file with dependency resolution

## Quick Start

### 1. Detect Conflicts
```bash
npm run resolve-conflicts
```

### 2. Test the Tools (Optional)
```bash
# Create simulated conflicts for testing
npm run test-conflicts

# Run resolution on test conflicts
npm run resolve-conflicts

# Restore original files
npm run restore-conflicts
```

## Automated Resolution

The `scripts/resolve-merge-conflicts.js` tool automatically:

1. **Scans** all three files for merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. **Creates backups** of original files before making changes
3. **Resolves conflicts** intelligently:
   - For `package.json`: Merges dependencies, preferring newer versions
   - For `package-lock.json` and `yarn.lock`: Flags for manual review
4. **Validates** resolved files for JSON correctness
5. **Provides guidance** for next steps

## Manual Resolution

When automatic resolution isn't possible or safe, follow these steps:

### For package.json
1. Open the file in your editor
2. Look for conflict markers:
   ```json
   <<<<<<< HEAD
   "dependency": "^1.0.0"
   =======
   "dependency": "^2.0.0"
   >>>>>>> main
   ```
3. Choose the appropriate version (usually the newer one)
4. Remove all conflict markers
5. Ensure valid JSON syntax

### For package-lock.json
1. **Delete the entire file**: `rm package-lock.json`
2. **Regenerate**: `npm install`
3. **Commit the new lock file**

### For yarn.lock  
1. **Delete the entire file**: `rm yarn.lock`
2. **Regenerate**: `yarn install`
3. **Commit the new lock file**

## Best Practices

### Prevention
- **Pull frequently** from main branch to minimize conflicts
- **Use exact versions** in package.json when possible
- **Coordinate dependency updates** with team members

### Resolution
- **Always backup** files before manual editing
- **Test thoroughly** after resolving conflicts
- **Regenerate lock files** rather than manually editing them
- **Commit resolved changes** promptly

### Validation
After resolving conflicts:
1. **Install dependencies**: `npm install` or `yarn install`
2. **Run tests**: `npm test`
3. **Build the project**: `npm run build` (if applicable)
4. **Check for runtime errors**

## Troubleshooting

### Common Issues

**Invalid JSON after resolution:**
- Check for missing commas or brackets
- Use a JSON validator
- Restore from backup and try manual resolution

**Dependency version conflicts:**
- Check compatibility between versions
- Consult package documentation
- Consider using `npm ls` to check dependency tree

**Lock file corruption:**
- Delete and regenerate the lock file
- Clear node_modules: `rm -rf node_modules`
- Fresh install: `npm install` or `yarn install`

### Recovery
If something goes wrong:
1. Restore from automatic backups (`.backup-TIMESTAMP` files)
2. Use git to restore files: `git checkout HEAD -- package.json`
3. Start the resolution process again

## File Locations

- Resolution script: `scripts/resolve-merge-conflicts.js`
- Test script: `scripts/test-conflicts.js`
- This documentation: `docs/MERGE_CONFLICTS.md`

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run resolve-conflicts` | Detect and resolve conflicts |
| `npm run test-conflicts` | Create test conflicts |
| `npm run restore-conflicts` | Restore original files |
| `node scripts/resolve-merge-conflicts.js [path]` | Run with custom project path |

## Support

For additional help:
1. Check the project README
2. Review git documentation on merge conflicts
3. Consult with team members
4. Consider using GUI merge tools for complex conflicts
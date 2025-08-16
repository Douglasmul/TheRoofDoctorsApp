#!/usr/bin/env node

/**
 * Merge Conflict Resolution Tool for Package Files
 * Detects and helps resolve merge conflicts in package.json, package-lock.json, and yarn.lock
 */

const fs = require('fs');
const path = require('path');

const CONFLICT_MARKERS = {
  START: /^<<<<<<< .+$/,
  MIDDLE: /^======= *$/,
  END: /^>>>>>>> .+$/
};

const TARGET_FILES = [
  'package.json',
  'package-lock.json', 
  'yarn.lock'
];

class MergeConflictResolver {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.conflicts = new Map();
  }

  /**
   * Detect merge conflicts in target files
   */
  detectConflicts() {
    console.log('🔍 Scanning for merge conflicts...\n');
    let hasConflicts = false;

    for (const fileName of TARGET_FILES) {
      const filePath = path.join(this.projectRoot, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${fileName} not found, skipping...`);
        continue;
      }

      const conflicts = this.scanFileForConflicts(filePath);
      if (conflicts.length > 0) {
        hasConflicts = true;
        this.conflicts.set(fileName, conflicts);
        console.log(`❌ ${fileName}: Found ${conflicts.length} conflict(s)`);
        this.displayConflicts(fileName, conflicts);
      } else {
        console.log(`✅ ${fileName}: No conflicts detected`);
      }
    }

    return hasConflicts;
  }

  /**
   * Scan a single file for merge conflict markers
   */
  scanFileForConflicts(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const conflicts = [];
    let currentConflict = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      if (CONFLICT_MARKERS.START.test(line)) {
        currentConflict = {
          startLine: lineNumber,
          startContent: line,
          head: [],
          base: [],
          endLine: null,
          endContent: null
        };
      } else if (CONFLICT_MARKERS.MIDDLE.test(line) && currentConflict) {
        currentConflict.middleLine = lineNumber;
      } else if (CONFLICT_MARKERS.END.test(line) && currentConflict) {
        currentConflict.endLine = lineNumber;
        currentConflict.endContent = line;
        conflicts.push(currentConflict);
        currentConflict = null;
      } else if (currentConflict) {
        if (currentConflict.middleLine) {
          currentConflict.base.push(line);
        } else {
          currentConflict.head.push(line);
        }
      }
    }

    return conflicts;
  }

  /**
   * Display conflict details
   */
  displayConflicts(fileName, conflicts) {
    conflicts.forEach((conflict, index) => {
      console.log(`\n  Conflict #${index + 1} (lines ${conflict.startLine}-${conflict.endLine}):`);
      console.log(`    HEAD version (${conflict.head.length} lines)`);
      console.log(`    BASE version (${conflict.base.length} lines)`);
    });
  }

  /**
   * Attempt to automatically resolve package.json conflicts
   */
  resolvePackageJsonConflicts(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const resolved = [];
    let inConflict = false;
    let headSection = [];
    let baseSection = [];
    let isInBase = false;

    for (const line of lines) {
      if (CONFLICT_MARKERS.START.test(line)) {
        inConflict = true;
        headSection = [];
        baseSection = [];
        isInBase = false;
        continue;
      }

      if (CONFLICT_MARKERS.MIDDLE.test(line)) {
        isInBase = true;
        continue;
      }

      if (CONFLICT_MARKERS.END.test(line)) {
        // Resolve the conflict intelligently
        const resolvedSection = this.resolveJsonConflict(headSection, baseSection);
        resolved.push(...resolvedSection);
        inConflict = false;
        continue;
      }

      if (inConflict) {
        if (isInBase) {
          baseSection.push(line);
        } else {
          headSection.push(line);
        }
      } else {
        resolved.push(line);
      }
    }

    return resolved.join('\n');
  }

  /**
   * Intelligently resolve JSON conflicts by merging dependencies
   */
  resolveJsonConflict(headLines, baseLines) {
    try {
      // For package.json conflicts, prefer a safer approach
      // Look for dependency conflicts specifically
      const headContent = headLines.join('\n').trim();
      const baseContent = baseLines.join('\n').trim();
      
      // Check if this is a dependencies section conflict
      if (this.isDependencyConflict(headContent, baseContent)) {
        return this.resolveDependencyConflict(headLines, baseLines);
      }
      
      // For scripts or other sections, prefer the base (incoming) version
      return baseLines;
    } catch (error) {
      console.log(`⚠️  Could not auto-resolve JSON conflict: ${error.message}`);
      return baseLines; // Default to BASE version for safety
    }
  }

  /**
   * Check if this is a dependency-related conflict
   */
  isDependencyConflict(headContent, baseContent) {
    const dependencyKeywords = ['dependencies', 'devDependencies', 'peerDependencies'];
    return dependencyKeywords.some(keyword => 
      headContent.includes(`"${keyword}"`) || baseContent.includes(`"${keyword}"`));
  }

  /**
   * Resolve dependency conflicts by merging package versions
   */
  resolveDependencyConflict(headLines, baseLines) {
    const headDeps = this.extractDependencies(headLines);
    const baseDeps = this.extractDependencies(baseLines);
    
    // Merge dependencies, preferring newer versions
    const merged = { ...headDeps };
    for (const [name, version] of Object.entries(baseDeps)) {
      if (!merged[name] || this.isNewerVersion(version, merged[name])) {
        merged[name] = version;
      }
    }
    
    // Format back to lines
    const lines = [];
    for (const [name, version] of Object.entries(merged)) {
      lines.push(`    "${name}": "${version}",`);
    }
    
    // Remove trailing comma from last line if there are lines
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      if (lastLine.endsWith(',')) {
        lines[lines.length - 1] = lastLine.slice(0, -1);
      }
    }
    
    return lines;
  }

  /**
   * Extract dependencies from lines
   */
  extractDependencies(lines) {
    const deps = {};
    for (const line of lines) {
      const match = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]+)"/);
      if (match) {
        deps[match[1]] = match[2];
      }
    }
    return deps;
  }

  /**
   * Simple version comparison (newer version wins)
   */
  isNewerVersion(version1, version2) {
    // Handle common prefixes and suffixes
    const normalize = (v) => {
      return v.replace(/^[\^~]/, '').replace(/-alpha|-beta|-rc.*$/, '');
    };
    
    const v1 = normalize(version1);
    const v2 = normalize(version2);
    
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    // Compare each version part
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (isNaN(p1) || isNaN(p2)) {
        // If we can't parse numbers, fall back to string comparison
        return version1.localeCompare(version2) > 0;
      }
      
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }
    
    return false;
  }

  /**
   * Parse partial JSON from lines
   */
  parsePartialJson(lines) {
    const content = lines.join('\n').trim();
    if (!content) return {};
    
    // Try to parse as complete JSON first
    try {
      return JSON.parse(content);
    } catch {
      // If that fails, try to extract dependencies section
      const depMatch = content.match(/"(dependencies|devDependencies)"\s*:\s*{([^}]*)}/);
      if (depMatch) {
        const deps = {};
        const depContent = depMatch[2];
        const depLines = depContent.split('\n');
        
        for (const line of depLines) {
          const match = line.match(/^\s*"([^"]+)"\s*:\s*"([^"]+)"/);
          if (match) {
            deps[match[1]] = match[2];
          }
        }
        return { [depMatch[1]]: deps };
      }
    }
    
    return {};
  }

  /**
   * Merge JSON objects intelligently
   */
  mergeJsonObjects(head, base) {
    const merged = { ...head };
    
    for (const [key, value] of Object.entries(base)) {
      if (key === 'dependencies' || key === 'devDependencies') {
        // Ensure the key exists in merged before spreading
        if (!merged[key] || typeof merged[key] !== 'object') {
          merged[key] = {};
        }
        merged[key] = { ...value, ...merged[key] };
      } else if (!merged.hasOwnProperty(key)) {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Format JSON object back to lines
   */
  formatJsonLines(obj) {
    return JSON.stringify(obj, null, 2).split('\n');
  }

  /**
   * Create backup of files before resolution
   */
  createBackups() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const fileName of TARGET_FILES) {
      const filePath = path.join(this.projectRoot, fileName);
      if (fs.existsSync(filePath)) {
        const backupPath = path.join(this.projectRoot, `${fileName}.backup-${timestamp}`);
        fs.copyFileSync(filePath, backupPath);
        console.log(`📋 Created backup: ${backupPath}`);
      }
    }
  }

  /**
   * Validate resolved files
   */
  validateResolvedFiles() {
    console.log('\n🔍 Validating resolved files...\n');
    
    let allValid = true;
    
    // Validate package.json
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        const content = fs.readFileSync(packagePath, 'utf8');
        JSON.parse(content);
        console.log('✅ package.json: Valid JSON');
      }
    } catch (error) {
      console.log(`❌ package.json: Invalid JSON - ${error.message}`);
      allValid = false;
    }
    
    // Validate package-lock.json if it exists
    try {
      const lockPath = path.join(this.projectRoot, 'package-lock.json');
      if (fs.existsSync(lockPath)) {
        const content = fs.readFileSync(lockPath, 'utf8');
        JSON.parse(content);
        console.log('✅ package-lock.json: Valid JSON');
      }
    } catch (error) {
      console.log(`❌ package-lock.json: Invalid JSON - ${error.message}`);
      allValid = false;
    }
    
    // Note: yarn.lock is not JSON, so we just check if it's readable
    try {
      const yarnPath = path.join(this.projectRoot, 'yarn.lock');
      if (fs.existsSync(yarnPath)) {
        fs.readFileSync(yarnPath, 'utf8');
        console.log('✅ yarn.lock: Readable');
      }
    } catch (error) {
      console.log(`❌ yarn.lock: Not readable - ${error.message}`);
      allValid = false;
    }
    
    return allValid;
  }

  /**
   * Main resolution process
   */
  async resolveConflicts() {
    console.log('🚀 Starting merge conflict resolution process...\n');
    
    // Step 1: Detect conflicts
    const hasConflicts = this.detectConflicts();
    
    if (!hasConflicts) {
      console.log('\n🎉 No merge conflicts detected in package files!');
      return true;
    }

    // Step 2: Create backups
    console.log('\n📋 Creating backups...');
    this.createBackups();

    // Step 3: Attempt automatic resolution
    console.log('\n🔧 Attempting automatic resolution...');
    
    for (const [fileName, conflicts] of this.conflicts) {
      if (fileName === 'package.json') {
        const filePath = path.join(this.projectRoot, fileName);
        const resolved = this.resolvePackageJsonConflicts(filePath);
        fs.writeFileSync(filePath, resolved, 'utf8');
        console.log(`✅ Resolved conflicts in ${fileName}`);
      } else {
        console.log(`⚠️  ${fileName}: Manual resolution required`);
      }
    }

    // Step 4: Validate results
    const isValid = this.validateResolvedFiles();
    
    if (isValid) {
      console.log('\n🎉 Merge conflict resolution completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Review the resolved files');
      console.log('   2. Run npm install or yarn install to update lock files');
      console.log('   3. Test your application');
      console.log('   4. Commit the resolved changes');
    } else {
      console.log('\n❌ Some files may need manual review');
    }

    return isValid;
  }
}

// CLI interface
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const resolver = new MergeConflictResolver(projectPath);
  resolver.resolveConflicts().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = MergeConflictResolver;
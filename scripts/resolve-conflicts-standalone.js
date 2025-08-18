#!/usr/bin/env node

/**
 * Standalone Merge Conflict Resolution Tool for Package Files
 * This version can run even when package.json has conflicts and Node.js can't parse it
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

class StandaloneMergeConflictResolver {
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

      try {
        const conflicts = this.scanFileForConflicts(filePath);
        if (conflicts.length > 0) {
          hasConflicts = true;
          this.conflicts.set(fileName, conflicts);
          console.log(`❌ ${fileName}: Found ${conflicts.length} conflict(s)`);
          this.displayConflicts(fileName, conflicts);
        } else {
          console.log(`✅ ${fileName}: No conflicts detected`);
        }
      } catch (error) {
        console.log(`⚠️  ${fileName}: Error scanning file - ${error.message}`);
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
   * Display conflicts in a readable format
   */
  displayConflicts(fileName, conflicts) {
    for (const conflict of conflicts) {
      console.log(`   Lines ${conflict.startLine}-${conflict.endLine}:`);
      console.log(`     HEAD: ${conflict.head.length} lines`);
      console.log(`     BASE: ${conflict.base.length} lines`);
    }
    console.log('');
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
   * Resolve conflicts in package.json by merging dependencies intelligently
   */
  resolvePackageJsonConflicts(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const conflicts = this.conflicts.get('package.json') || [];
    
    let resolvedContent = content;
    
    // Process conflicts from end to beginning to maintain line numbers
    for (let i = conflicts.length - 1; i >= 0; i--) {
      const conflict = conflicts[i];
      const resolved = this.resolveJsonConflict(conflict.head, conflict.base);
      
      // Replace the conflict section with resolved content
      const beforeConflict = lines.slice(0, conflict.startLine - 1);
      const afterConflict = lines.slice(conflict.endLine);
      const resolvedLines = [...beforeConflict, ...resolved, ...afterConflict];
      
      resolvedContent = resolvedLines.join('\n');
      lines.splice(0, lines.length, ...resolvedLines);
    }
    
    return resolvedContent;
  }

  /**
   * Intelligently resolve JSON conflicts by merging dependencies
   */
  resolveJsonConflict(headLines, baseLines) {
    try {
      // For package.json conflicts, prefer the base (incoming) version for most sections
      // but try to merge dependencies intelligently
      const headContent = headLines.join('\n').trim();
      const baseContent = baseLines.join('\n').trim();
      
      // Check if this looks like a dependencies section
      if (this.isDependencyConflict(headContent, baseContent)) {
        return this.resolveDependencyConflict(headLines, baseLines);
      }
      
      // For other sections, prefer the base (incoming) version
      return baseLines;
    } catch (error) {
      console.log(`⚠️  Could not auto-resolve JSON conflict: ${error.message}`);
      return baseLines; // Default to BASE version for safety
    }
  }

  /**
   * Check if a conflict is in a dependencies section
   */
  isDependencyConflict(headContent, baseContent) {
    const dependencyPattern = /^\s*"[@\w-]+"\s*:\s*"[^"]+"/;
    return dependencyPattern.test(headContent) || dependencyPattern.test(baseContent);
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
    
    // Remove trailing comma from last line
    if (lines.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
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
    // Simple semver comparison - strip prefixes and compare
    const clean1 = version1.replace(/^[\^~]/, '');
    const clean2 = version2.replace(/^[\^~]/, '');
    
    const parts1 = clean1.split('.').map(n => parseInt(n) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n) || 0);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }
    
    return false; // Equal versions
  }

  /**
   * Validate resolved files for JSON correctness
   */
  validateResolvedFiles() {
    let allValid = true;
    
    for (const fileName of TARGET_FILES) {
      const filePath = path.join(this.projectRoot, fileName);
      
      if (!fs.existsSync(filePath)) continue;
      
      if (fileName === 'package.json') {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
          console.log(`✅ ${fileName}: Valid JSON`);
        } catch (error) {
          console.log(`❌ ${fileName}: Invalid JSON - ${error.message}`);
          allValid = false;
        }
      }
    }
    
    return allValid;
  }

  /**
   * Main resolution process
   */
  async resolveConflicts() {
    console.log('🚀 Starting standalone merge conflict resolution process...\n');
    
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
        console.log(`   Recommended: Delete the file and regenerate with package manager`);
        if (fileName === 'package-lock.json') {
          console.log(`   Run: rm package-lock.json && npm install`);
        } else if (fileName === 'yarn.lock') {
          console.log(`   Run: rm yarn.lock && yarn install`);
        }
      }
    }

    // Step 4: Validate results
    const isValid = this.validateResolvedFiles();
    
    if (isValid) {
      console.log('\n🎉 Merge conflict resolution completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Review the resolved files');
      console.log('   2. Delete and regenerate lock files:');
      console.log('      rm package-lock.json yarn.lock');
      console.log('      npm install && yarn install');
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
  const resolver = new StandaloneMergeConflictResolver(projectPath);
  resolver.resolveConflicts().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = StandaloneMergeConflictResolver;
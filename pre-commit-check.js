#!/usr/bin/env node

/**
 * Pre-commit check script to prevent committing sensitive information
 * 
 * To use:
 * 1. Make this file executable: chmod +x pre-commit-check.js
 * 2. Add to your .git/hooks/pre-commit or use husky
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Patterns to look for in staged files
const SENSITIVE_PATTERNS = [
  // API keys and tokens
  /(api[_-]?key|apikey|api[_-]?token|auth[_-]?token)[\s]*[=:][\s]*['"]([^'"]{8,})['"](?!example|your)/i,
  // Firebase config values (when not using environment variables)
  /firebase.+\.config[\s\S]{0,100}apiKey:[\s]*['"]([^'"]{8,})['"]/i,
  // Generic secrets
  /(password|secret|credential|private[_-]?key)[\s]*[=:][\s]*['"]([^'"]{8,})['"](?!example|your)/i,
  // Explicit API keys
  /AI[a-zA-Z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,  // AWS
  /sk-[a-zA-Z0-9]{20,}/, // OpenAI
  /AIza[0-9A-Za-z-_]{35}/, // Google API Key
  /gh[pousr]_[A-Za-z0-9_]{20,}/, // GitHub
];

// Files to ignore
const IGNORED_FILES = [
  '.env.example',
  'pre-commit-check.js',
  'README.md',
];

// Extensions to check
const EXTENSIONS_TO_CHECK = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.env', '.yaml', '.yml'
];

// Get staged files
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only').toString();
    return output.split('\n').filter(file => file.trim() !== '');
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    process.exit(1);
  }
}

// Check if a file should be scanned
function shouldScanFile(file) {
  if (IGNORED_FILES.some(ignored => file.includes(ignored))) {
    return false;
  }
  
  const ext = path.extname(file);
  return EXTENSIONS_TO_CHECK.includes(ext);
}

// Scan file for sensitive data
function scanFile(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let foundIssues = false;
    
    SENSITIVE_PATTERNS.forEach(pattern => {
      let match;
      let lineNumber = 0;
      
      for (const line of lines) {
        lineNumber++;
        const matches = line.match(pattern);
        
        if (matches) {
          console.error(`\x1b[31mPotential secret found in ${file} at line ${lineNumber}:\x1b[0m`);
          console.error(`\x1b[33m${line.trim()}\x1b[0m`);
          foundIssues = true;
        }
      }
    });
    
    return foundIssues;
  } catch (error) {
    console.error(`Error scanning file ${file}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  const stagedFiles = getStagedFiles();
  let foundSecrets = false;
  
  for (const file of stagedFiles) {
    if (shouldScanFile(file) && fs.existsSync(file)) {
      if (scanFile(file)) {
        foundSecrets = true;
      }
    }
  }
  
  if (foundSecrets) {
    console.error(`
\x1b[31m==================================================
WARNING: Potential secrets found in staged files!
==================================================\x1b[0m

Please remove the sensitive data before committing.
If you need to override this check, use --no-verify:
  git commit --no-verify

`);
    process.exit(1);
  } else {
    console.log('\x1b[32mNo secrets found in staged files.\x1b[0m');
  }
}

main(); 
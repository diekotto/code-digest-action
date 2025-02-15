const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

const githubRepository = process.env.GITHUB_REPOSITORY || 'local';
const githubBranch = process.env.GITHUB_REF || 'local';
const githubCommit = process.env.GITHUB_SHA || 'local';
const ignorePatterns = process.env.IGNORE_PATTERNS || '';
const patternSeparator = process.env.PATTERN_SEPARATOR || '';

function loadGitignore() {
  const ignoreFiles = ignore();
  const defaultToIgnore = ignorePatterns.split(patternSeparator);
  console.log('Ignoring:', defaultToIgnore);
  ignoreFiles.add(defaultToIgnore.join('\n'));
  try {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    ignoreFiles.add(gitignoreContent);
    console.log('Included .gitignore content to the ignored files.');
  } catch (error) {
    console.error('No .gitignore found, careful with the context.');
  }
  return ignoreFiles;
}

function isTextFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check for NULL bytes - if found, likely a binary file
    return !buffer.includes(0);
  } catch (error) {
    return false;
  }
}

function scanDirectory(dirPath, ig, filesProcessed) {
  const digest = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    // Skip if path matches gitignore rules
    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      const subDigest = scanDirectory(fullPath, ig, filesProcessed);
      digest.push(...subDigest);
    } else if (entry.isFile()) {
      if (isTextFile(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          digest.push(`=== ${relativePath} ===\n${content}\n`);
          filesProcessed.count += 1;
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }

  return digest;
}

function generateDirectoryTree(dirPath, ig, prefix = '', isLast = true) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const filteredEntries = entries.filter(entry => {
    const relativePath = path.relative(process.cwd(), path.join(dirPath, entry.name));
    return !ig.ignores(relativePath);
  });

  let treeContent = '';

  // For the root directory, add the header
  if (prefix === '') {
    treeContent += 'Directory structure:\n';
    const dirName = path.basename(process.cwd());
    treeContent += `└── ${dirName}/\n`;
    prefix = '    ';
  }

  filteredEntries.forEach((entry, index) => {
    const isLastEntry = index === filteredEntries.length - 1;
    const marker = isLastEntry ? '└──' : '├──';
    const entryPrefix = `${prefix}${marker} `;
    const entryName = entry.name + (entry.isDirectory() ? '/' : '');

    treeContent += `${entryPrefix}${entryName}\n`;

    if (entry.isDirectory()) {
      const newPrefix = `${prefix}${isLastEntry ? '    ' : '│   '}`;
      const subDirPath = path.join(dirPath, entry.name);
      treeContent += generateDirectoryTree(subDirPath, ig, newPrefix, isLastEntry);
    }
  });

  return treeContent;
}

function main() {
  try {
    const ig = loadGitignore();
    let filesProcessed = { count: 0 };
    const digest = scanDirectory(process.cwd(), ig, filesProcessed);

    // Add metadata header
    const metadata = {
      timestamp: new Date().toISOString(),
      repository: githubRepository,
      branch: githubBranch,
      commit: githubCommit,
      filesProcessed,
    };

    const header = `
===============================
Code Digest
===============================
Generated: ${metadata.timestamp}
Repository: ${metadata.repository}
Branch: ${metadata.branch}
Commit: ${metadata.commit}
Files Processed: ${metadata.filesProcessed.count}
===============================\n`;

    const treeContent = generateDirectoryTree(process.cwd(), ig);

    fs.writeFileSync('code-summary.txt', header);
    fs.writeFileSync('code-digest.txt', digest.join('\n'));
    fs.writeFileSync('directory-tree.txt', treeContent);

    console.log('Digest generated successfully!');
  } catch (error) {
    console.error('Error generating digest:', error);
    process.exit(1);
  }
}

main();

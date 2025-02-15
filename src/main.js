const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

function loadGitignore() {
  const defaultToIgnore = ['.gitignore','node_modules', '.git', 'dist', 'build', '.env*', '*.log', 'bin', 'package-lock.json'];
  try {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    const ignored = ignore().add(gitignoreContent);
    ignored.add(defaultToIgnore.join('\n'));
    return ignored;
  } catch (error) {
    // If no .gitignore exists, return default ignore rules
    return ignore().add(defaultToIgnore.join('\n'));
  }
}

function isDirectory(path) {
  try {
    const stat = fs.statSync(path);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
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

function scanDirectory(dirPath, ig) {
  const digest = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    // Skip if path matches gitignore rules
    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      const subDigest = scanDirectory(fullPath, ig);
      digest.push(...subDigest);
    } else if (entry.isFile()) {
      if (isTextFile(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          digest.push(`\n=== ${relativePath} ===\n${content}`);
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }

  return digest;
}

function main() {
  try {
    const ig = loadGitignore();
    const digest = scanDirectory(process.cwd(), ig);

    // Add metadata header
    const metadata = {
      timestamp: new Date().toISOString(),
      repository: process.env.GITHUB_REPOSITORY || 'local',
      branch: process.env.GITHUB_REF || 'local',
      commit: process.env.GITHUB_SHA || 'local',
    };

    const header = `
===============================
Code Digest
===============================
Generated: ${metadata.timestamp}
Repository: ${metadata.repository}
Branch: ${metadata.branch}
Commit: ${metadata.commit}
===============================\n`;

    fs.writeFileSync('code-digest.txt', header + digest.join('\n'));

    console.log('Digest generated successfully!');
  } catch (error) {
    console.error('Error generating digest:', error);
    process.exit(1);
  }
}

main();

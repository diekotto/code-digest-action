const mockFs = require('mock-fs');
const path = require('path');
const fs = require('fs').promises;

/**
 * Create a mock filesystem for testing
 * @param {Object} structure - Structure of the mock filesystem
 * @param {Boolean} emptyDefault - Decide if using or not the default fs structure
 * @returns {Function} Function to restore the real filesystem
 */
function createMockFs(structure = {}, emptyDefault = false) {
  const defaultStructure = {
    '.gitignore': 'node_modules\n*.log\n',
    src: {
      'index.js': 'console.log("Hello World");',
      utils: {
        'helper.js': 'function helper() { return true; }',
      },
    },
    '.github': {
      workflows: {
        'ci.yml': 'name: CI\non: push',
      },
    },
    '.git': {
      HEAD: 'ref: refs/heads/main',
      config: '[core]\n\trepositoryformatversion = 0\n',
    },
    node_modules: {
      'some-package': {
        'index.js': 'module.exports = {};',
      },
    },
  };

  mockFs({
    ...(emptyDefault ? {} : defaultStructure),
    ...structure,
  });

  return () => mockFs.restore();
}

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a temporary directory structure for testing
 * @param {string} baseDir - Base directory
 * @param {Object} structure - Structure to create
 * @returns {Promise<string>} Path to created directory
 */
async function createTempDir(baseDir = 'temp-test', structure = {}) {
  const tempDir = path.join(process.cwd(), baseDir);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    for (const [key, value] of Object.entries(structure)) {
      const itemPath = path.join(tempDir, key);

      if (typeof value === 'object') {
        await fs.mkdir(itemPath, { recursive: true });
        await createTempDir(path.join(baseDir, key), value);
      } else {
        await fs.writeFile(itemPath, value);
      }
    }

    return tempDir;
  } catch (error) {
    console.error(`Error creating temp directory: ${error.message}`);
    throw error;
  }
}

/**
 * Remove a directory recursively
 * @param {string} dir - Directory to remove
 * @returns {Promise<void>}
 */
async function removeTempDir(dir) {
  const tempDir = path.join(process.cwd(), dir);

  try {
    const rm = fs.rm || fs.rmdir; // Handle Node.js versions that don't have fs.rm
    await rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error removing temp directory: ${error.message}`);
  }
}

module.exports = {
  createMockFs,
  wait,
  createTempDir,
  removeTempDir,
};

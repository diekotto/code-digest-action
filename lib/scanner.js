const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');

/**
 * FileScanner - Handles directory scanning and file content processing
 * @class
 */
class FileScanner {
  constructor(options = {}) {
    this.options = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default max file size
      encoding: 'utf8',
      includeBinaryFiles: false,
      customBinaryTest: null,
      includeDotFiles: false,
      ...options,
    };

    this.stats = {
      filesProcessed: 0,
      filesSkipped: 0,
      totalSize: 0,
      errors: [],
    };
  }

  /**
   * Reset scanner statistics
   */
  resetStats() {
    this.stats = {
      filesProcessed: 0,
      filesSkipped: 0,
      totalSize: 0,
      errors: [],
    };
  }

  /**
   * Scan a directory and process its files
   * @param {Object} params - Scan parameters
   * @param {string} params.dirPath - Directory path to scan
   * @param {Object} params.ignoreManager - Instance of GitIgnoreManager
   * @param {Object} [params.options] - Override default options
   * @returns {Promise<Object>} - Scan results
   */
  async scanDirectory({ dirPath, ignoreManager, options = {} }) {
    const config = { ...this.options, ...options };
    this.resetStats();

    const digest = [];
    try {
      await this._scanRecursive({
        dirPath,
        ignoreManager,
        digest,
        config,
      });

      return {
        digest,
        stats: this.stats,
      };
    } catch (error) {
      this.stats.errors.push({
        path: dirPath,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Recursively scan directory
   * @private
   */
  async _scanRecursive({ dirPath, ignoreManager, digest, config }) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Always skip .git directory
      if (entry.name === '.git') {
        this.stats.filesSkipped++;
        continue;
      }

      // Skip dot files if not included
      if (!config.includeDotFiles && entry.name.startsWith('.')) {
        this.stats.filesSkipped++;
        continue;
      }

      // Skip if path matches gitignore rules
      if (ignoreManager && ignoreManager.shouldIgnore(fullPath)) {
        this.stats.filesSkipped++;
        continue;
      }

      if (entry.isDirectory()) {
        await this._scanRecursive({
          dirPath: fullPath,
          ignoreManager,
          digest,
          config,
        });
      } else if (entry.isFile()) {
        try {
          const content = await this._processFile(fullPath, config);
          if (content !== null) {
            digest.push({
              path: relativePath,
              content,
            });
            this.stats.filesProcessed++;
          } else {
            this.stats.filesSkipped++;
          }
        } catch (error) {
          this.stats.errors.push({
            path: relativePath,
            error: error.message,
          });
          this.stats.filesSkipped++;
        }
      }
    }
  }

  /**
   * Process a single file
   * @private
   */
  async _processFile(filePath, config) {
    const stats = await fs.stat(filePath);
    this.stats.totalSize += stats.size;

    // Skip files that are too large
    if (stats.size > config.maxFileSize) {
      return null;
    }

    // Check if file is binary
    if (!config.includeBinaryFiles && (await this._isBinaryFile(filePath, config))) {
      return null;
    }

    try {
      const content = await fs.readFile(filePath, config.encoding);
      return content;
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if a file is binary
   * @private
   */
  async _isBinaryFile(filePath, config) {
    // Use custom binary test if provided
    if (config.customBinaryTest) {
      return config.customBinaryTest(filePath);
    }

    // Default binary check
    try {
      const buffer = Buffer.alloc(4096);
      const fd = await fs.open(filePath, 'r');
      const { bytesRead } = await fd.read(buffer, 0, 4096, 0);
      await fd.close();

      // Check for NULL bytes in the first 4K
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      throw new Error(`Error checking file type ${filePath}: ${error.message}`);
    }
  }

  /**
   * Stream process a file
   * @param {string} filePath - Path to file
   * @param {Object} [options] - Processing options
   * @returns {Promise<Readable>} - Stream of processed content
   */
  async createFileStream(filePath, options = {}) {
    const config = { ...this.options, ...options };

    if (!config.includeBinaryFiles && (await this._isBinaryFile(filePath, config))) {
      throw new Error('Binary file detected');
    }

    const fileStream = fs.createReadStream(filePath, {
      encoding: config.encoding,
      highWaterMark: 64 * 1024, // 64KB chunks
    });

    return fileStream;
  }

  /**
   * Get scanner statistics
   * @returns {Object} - Current scanner statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Transform the default digest into txt raw format
   * @param {Object[]} digest
   * @returns {string}
   */
  digestToText(digest) {
    const text = [];
    for (const file of digest) {
      text.push(`=== ${file.path} ===`);
      text.push(`${file.content}\n`);
    }
    return text.join('\n');
  }
}

// Export the class and a factory function
module.exports = {
  FileScanner,
  createScanner: options => new FileScanner(options),
};

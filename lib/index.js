const { createManager } = require('./gitignore');
const { createScanner } = require('./scanner');
const { createTree } = require('./tree');

// Default patterns to ignore
const DEFAULT_IGNORE_PATTERNS = [
  // Build and dependency files
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  // Build artifacts
  'dist/**',
  'build/**',
  // Large generated files
  '*.min.js',
  '*.bundle.js',
  // Other typically ignored files
  'coverage/**',
  '.nyc_output/**',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * CodeDigest - Main class that integrates all functionality
 * @class
 */
class CodeDigest {
  constructor(options = {}) {
    this.options = {
      ignorePatterns: [],
      gitignorePath: '.gitignore',
      maxFileSize: 10 * 1024 * 1024,
      includeDotFiles: false,
      encoding: 'utf8',
      ...options,
    };

    this.options.ignorePatterns = [...new Set([...DEFAULT_IGNORE_PATTERNS, ...this.options.ignorePatterns])];

    // Initialize components with default options
    this.ignoreManager = null;
    this.scanner = createScanner({
      maxFileSize: this.options.maxFileSize,
      encoding: this.options.encoding,
      includeDotFiles: this.options.includeDotFiles,
    });
    this.tree = createTree({
      includeDotFiles: this.options.includeDotFiles,
    });
  }

  /**
   * Initialize the CodeDigest instance
   * @param {Object} [options] - Override initialization options
   * @returns {Promise<CodeDigest>} - Initialized instance
   */
  async initialize(options = {}) {
    const config = { ...this.options, ...options };

    // Initialize ignore manager
    this.ignoreManager = await createManager({
      patternSeparator: ',',
      additionalPatterns: ['.git/**', ...config.ignorePatterns],
      gitignorePath: config.gitignorePath,
    }).initialize();

    return this;
  }

  /**
   * Generate a complete code digest
   * @param {Object} params - Parameters for digest generation
   * @param {string} params.directory - Directory to process
   * @param {Object} [params.options] - Override options
   * @returns {Promise<Object>} - Complete digest results
   */
  async generateDigest({ directory, options = {} }) {
    if (!this.ignoreManager) {
      throw new Error('CodeDigest not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    // Scan directory for files
    const { digest: files, stats: scanStats } = await this.scanner.scanDirectory({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    const filesText = this.scanner.digestToText(files);

    // Generate directory tree
    const treeText = await this.tree.generateTree({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    const treeJson = await this.tree.generateJsonTree({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    const endTime = Date.now();

    // Prepare metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      directory: directory,
      executionTime: this.normalizeExecutionTime(endTime, startTime),
      stats: {
        ...scanStats,
        ignoredPatterns: this.ignoreManager.getPatterns(),
      },
    };

    return {
      metadata,
      files: {
        text: filesText,
        json: files,
      },
      tree: {
        text: treeText,
        json: treeJson,
      },
    };
  }

  /**
   * Generate only the directory tree
   * @param {Object} params - Parameters for tree generation
   * @returns {Promise<Object>} - Tree in both text and JSON formats
   */
  async generateTree({ directory, options = {} }) {
    if (!this.ignoreManager) {
      throw new Error('CodeDigest not initialized. Call initialize() first.');
    }

    const treeText = await this.tree.generateTree({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    const treeJson = await this.tree.generateJsonTree({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    return {
      text: treeText,
      json: treeJson,
    };
  }

  /**
   * Scan directory without generating tree
   * @param {Object} params - Parameters for scanning
   * @returns {Promise<Object>} - Scan results with metadata
   */
  async scanDirectory({ directory, options = {} }) {
    if (!this.ignoreManager) {
      throw new Error('CodeDigest not initialized. Call initialize() first.');
    }

    const { digest, stats } = await this.scanner.scanDirectory({
      dirPath: directory,
      ignoreManager: this.ignoreManager,
      options,
    });

    return {
      files: digest,
      stats: {
        ...stats,
        ignoredPatterns: this.ignoreManager.getPatterns(),
      },
    };
  }

  /**
   * Get current configuration
   * @returns {Object} - Current configuration options
   */
  getConfig() {
    return { ...this.options };
  }

  /**
   * Normalizes the time difference between two timestamps into a human-readable string
   * @param {number} endTime - The ending timestamp in milliseconds
   * @param {number} startTime - The starting timestamp in milliseconds
   * @returns {string} Formatted string showing either milliseconds or seconds with decimals
   * @example
   * // returns "1.5 seconds"
   * normalizeExecutionTime(Date.now() + 1500, Date.now())
   * // returns "45 ms"
   * normalizeExecutionTime(Date.now() + 45, Date.now())
   */
  normalizeExecutionTime(endTime, startTime) {
    const diffMs = endTime - startTime;
    if (diffMs < 1000) {
      return `${Math.round(diffMs)} ms`;
    }
    return `${(diffMs / 1000).toFixed(2)} seconds`;
  }
}

// Export the class and a factory function
module.exports = {
  CodeDigest,
  createDigest: options => new CodeDigest(options),
};

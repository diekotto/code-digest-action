const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');

/**
 * GitIgnoreManager - Manages .gitignore rules and pattern matching
 * @class
 */
class GitIgnoreManager {
  constructor(options = {}) {
    this.ignoreInstance = ignore();
    this.options = {
      patternSeparator: ',',
      additionalPatterns: [],
      gitignorePath: '.gitignore',
      ...options,
    };
  }

  /**
   * Initialize the ignore manager with patterns and .gitignore content
   * @param {Object} [options] - Override initialization options
   * @param {string[]} [options.additionalPatterns] - Additional patterns to ignore
   * @param {string} [options.gitignorePath] - Custom path to .gitignore file
   * @returns {Promise<GitIgnoreManager>} - Instance of GitIgnoreManager
   */
  async initialize(options = {}) {
    const config = { ...this.options, ...options };

    // Add additional patterns if provided
    if (config.additionalPatterns.length > 0) {
      this.addPatterns(config.additionalPatterns);
    }

    // Try to load .gitignore file
    try {
      const gitignorePath = path.resolve(process.cwd(), config.gitignorePath);
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      this.addPatterns(gitignoreContent.split('\n'));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Error reading .gitignore: ${error.message}`);
      }
      // If file doesn't exist, just continue without it
    }

    return this;
  }

  /**
   * Add patterns to the ignore list
   * @param {string|string[]} patterns - Pattern or array of patterns to add
   * @returns {GitIgnoreManager} - Instance of GitIgnoreManager
   */
  addPatterns(patterns) {
    if (!patterns) return this;

    if (Array.isArray(patterns)) {
      // Filter out empty lines and comments
      const validPatterns = patterns.filter(pattern => pattern && pattern.trim() && !pattern.startsWith('#'));
      this.ignoreInstance.add(validPatterns);
    } else if (typeof patterns === 'string') {
      this.ignoreInstance.add(patterns);
    }

    return this;
  }

  /**
   * Check if a path should be ignored
   * @param {string} filePath - Path to check
   * @returns {boolean} - True if path should be ignored
   */
  shouldIgnore(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    return this.ignoreInstance.ignores(relativePath);
  }

  /**
   * Filter an array of paths based on ignore rules
   * @param {string[]} paths - Array of paths to filter
   * @returns {string[]} - Filtered array of paths
   */
  filterPaths(paths) {
    return paths.filter(filePath => !this.shouldIgnore(filePath));
  }

  /**
   * Get all current ignore patterns
   * @returns {string[]} - Array of current ignore patterns
   */
  getPatterns() {
    return this.ignoreInstance.patterns;
  }
}

// Export the class and a factory function for convenience
module.exports = {
  GitIgnoreManager,
  createManager: options => new GitIgnoreManager(options),
};

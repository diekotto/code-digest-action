const fs = require('fs').promises;
const path = require('path');

/**
 * DirectoryTree - Generates a tree representation of a directory structure
 * @class
 */
class DirectoryTree {
  constructor(options = {}) {
    this.options = {
      maxDepth: Infinity,
      includeDotFiles: false,
      includeFiles: true,
      includeDirectories: true,
      ...options,
    };
  }

  /**
   * Generates a tree representation of a directory
   * @param {Object} params - Parameters for tree generation
   * @param {string} params.dirPath - Directory path to process
   * @param {Object} params.ignoreManager - Instance of GitIgnoreManager
   * @param {Object} [params.options] - Override default options
   * @returns {Promise<string>} - String representation of the directory tree
   */
  async generateTree({ dirPath, ignoreManager, options = {} }) {
    const config = { ...this.options, ...options };
    return this._generateTreeContent({
      dirPath,
      ignoreManager,
      prefix: '',
      isLast: true,
      depth: 0,
      config,
    });
  }

  /**
   * Generate tree content recursively
   * @private
   */
  async _generateTreeContent({ dirPath, ignoreManager, prefix = '', isLast = true, depth = 0, config }) {
    if (depth > config.maxDepth) {
      return '';
    }

    let treeContent = '';
    const entries = await this._getFilteredEntries(dirPath, ignoreManager, config);

    // Add root directory for the first level
    if (depth === 0) {
      treeContent = 'Directory structure:\n';
      const dirName = path.basename(dirPath);
      treeContent += `└── ${dirName}/\n`;
      prefix = '    ';
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLastEntry = i === entries.length - 1;
      const entryPath = path.join(dirPath, entry.name);

      const marker = isLastEntry ? '└──' : '├──';
      const entryPrefix = `${prefix}${marker} `;
      const displayName = this._getDisplayName(entry);

      if (!displayName) continue;

      treeContent += `${entryPrefix}${displayName}\n`;

      if (entry.isDirectory() && config.includeDirectories) {
        const newPrefix = `${prefix}${isLastEntry ? '    ' : '│   '}`;
        treeContent += await this._generateTreeContent({
          dirPath: entryPath,
          ignoreManager,
          prefix: newPrefix,
          isLast: isLastEntry,
          depth: depth + 1,
          config,
        });
      }
    }

    return treeContent;
  }

  /**
   * Get filtered directory entries
   * @private
   */
  async _getFilteredEntries(dirPath, ignoreManager, config) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    return entries.filter(entry => {
      const fullPath = path.join(dirPath, entry.name);

      // Check if path should be ignored
      if (ignoreManager && ignoreManager.shouldIgnore(fullPath)) {
        return false;
      }

      // Filter dot files if not included
      if (!config.includeDotFiles && entry.name.startsWith('.')) {
        return false;
      }

      // Filter based on entry type
      if (entry.isDirectory()) {
        return config.includeDirectories;
      }
      return config.includeFiles;
    });
  }

  /**
   * Get display name for an entry
   * @private
   */
  _getDisplayName(entry) {
    if (entry.isDirectory()) {
      return `${entry.name}/`;
    }
    if (entry.isSymbolicLink()) {
      return `${entry.name} -> symlink`;
    }
    return entry.name;
  }

  /**
   * Generate tree as JSON structure
   * @param {Object} params - Parameters for tree generation
   * @returns {Promise<Object>} - JSON representation of the directory tree
   */
  async generateJsonTree({ dirPath, ignoreManager, options = {} }) {
    const config = { ...this.options, ...options };
    return this._generateJsonContent({
      dirPath,
      ignoreManager,
      depth: 0,
      config,
    });
  }

  /**
   * Generate JSON content recursively
   * @private
   */
  async _generateJsonContent({ dirPath, ignoreManager, depth = 0, config }) {
    if (depth > config.maxDepth) {
      return null;
    }

    const entries = await this._getFilteredEntries(dirPath, ignoreManager, config);
    const result = {
      name: path.basename(dirPath),
      type: 'directory',
      children: [],
    };

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && config.includeDirectories) {
        const subtree = await this._generateJsonContent({
          dirPath: entryPath,
          ignoreManager,
          depth: depth + 1,
          config,
        });
        if (subtree) {
          result.children.push(subtree);
        }
      } else if (config.includeFiles) {
        result.children.push({
          name: entry.name,
          type: entry.isSymbolicLink() ? 'symlink' : 'file',
        });
      }
    }

    return result;
  }
}

// Export the class and a factory function
module.exports = {
  DirectoryTree,
  createTree: options => new DirectoryTree(options),
};

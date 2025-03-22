const { DirectoryTree } = require('../lib/tree');
const { GitIgnoreManager } = require('../lib/gitignore');
const { createMockFs } = require('./test-utils');
const path = require('path');

describe('DirectoryTree', () => {
  let restoreFs;
  let ignoreManager;

  beforeEach(async () => {
    restoreFs = createMockFs();
    ignoreManager = await new GitIgnoreManager().initialize();
  });

  afterEach(() => {
    restoreFs();
  });

  test('should generate a tree representation of a directory', async () => {
    const tree = new DirectoryTree();
    const result = await tree.generateTree({
      dirPath: process.cwd(),
      ignoreManager,
    });

    expect(result).toContain('Directory structure:');
    expect(result).toContain('src/');
    expect(result).toContain('index.js');
    expect(result).toContain('utils/');
    expect(result).toContain('helper.js');

    // By default, should not include .git directory
    expect(result).not.toContain('.git/');

    // By default, should not include node_modules (because of .gitignore)
    expect(result).not.toContain('node_modules/');
  });

  test('should generate JSON tree representation', async () => {
    const tree = new DirectoryTree();
    const result = await tree.generateJsonTree({
      dirPath: process.cwd(),
      ignoreManager,
    });

    expect(result.name).toBe(path.basename(process.cwd()));
    expect(result.type).toBe('directory');

    // Find src directory in children
    const srcDir = result.children.find(child => child.name === 'src');
    expect(srcDir).toBeDefined();
    expect(srcDir.type).toBe('directory');

    // Should not include .git directory
    const gitDir = result.children.find(child => child.name === '.git');
    expect(gitDir).toBeUndefined();

    // Should not include node_modules (because of .gitignore)
    const nodeModulesDir = result.children.find(child => child.name === 'node_modules');
    expect(nodeModulesDir).toBeUndefined();
  });

  test('should respect maxDepth option', async () => {
    const tree = new DirectoryTree({
      maxDepth: 1,
    });

    const result = await tree.generateTree({
      dirPath: process.cwd(),
      ignoreManager,
    });

    expect(result).toContain('src/');

    // Should not include deeper levels
    expect(result).not.toContain('helper.js');
    expect(result).not.toContain('ci.yml');
  });

  test('should include all dot files when includeDotFiles is true', async () => {
    const tree = new DirectoryTree({
      includeDotFiles: true,
    });

    const result = await tree.generateTree({
      dirPath: process.cwd(),
      ignoreManager,
    });

    // Should include .github directory
    expect(result).toContain('.gitignore');

    // Should still not include .git directory (explicitly ignored)
    expect(result).not.toContain('.git/');
  });
});

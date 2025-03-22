const { GitIgnoreManager } = require('../lib/gitignore');
const { createMockFs } = require('./test-utils');

describe('GitIgnoreManager', () => {
  let restoreFs;

  beforeEach(() => {
    restoreFs = createMockFs();
  });

  afterEach(() => {
    restoreFs();
  });

  test('should initialize with default options', async () => {
    const manager = new GitIgnoreManager();
    expect(manager.options.gitignorePath).toBe('.gitignore');
    expect(manager.options.additionalPatterns).toEqual([]);
  });

  test('should load patterns from .gitignore file', async () => {
    const manager = await new GitIgnoreManager().initialize();
    expect(manager.shouldIgnore('node_modules/some-file.js')).toBe(true);
    expect(manager.shouldIgnore('error.log')).toBe(true);
    expect(manager.shouldIgnore('src/index.js')).toBe(false);
  });

  test('should add additional patterns', async () => {
    const manager = await new GitIgnoreManager({
      additionalPatterns: ['*.json', 'temp/'],
    }).initialize();

    expect(manager.shouldIgnore('package.json')).toBe(true);
    expect(manager.shouldIgnore('temp/file.txt')).toBe(true);
    expect(manager.shouldIgnore('src/index.js')).toBe(false);
  });

  test('should work with custom .gitignore path', async () => {
    // Create a custom .gitignore file
    restoreFs();
    restoreFs = createMockFs({
      'custom-gitignore': '*.txt\nbuild/',
    });

    const manager = await new GitIgnoreManager({
      gitignorePath: 'custom-gitignore',
    }).initialize();

    expect(manager.shouldIgnore('file.txt')).toBe(true);
    expect(manager.shouldIgnore('build/output.js')).toBe(true);
    expect(manager.shouldIgnore('src/index.js')).toBe(false);
  });

  test('should continue without .gitignore if file does not exist', async () => {
    restoreFs();
    restoreFs = createMockFs(
      {
        // No .gitignore file
      },
      true,
    );

    const manager = await new GitIgnoreManager().initialize();
    expect(manager.shouldIgnore('node_modules/file.js')).toBe(false);

    // Add patterns manually
    manager.addPatterns(['node_modules/']);
    expect(manager.shouldIgnore('node_modules/file.js')).toBe(true);
  });

  test('should filter paths based on ignore rules', async () => {
    const manager = await new GitIgnoreManager({
      additionalPatterns: ['*.json'],
    }).initialize();

    const paths = ['src/index.js', 'node_modules/package/index.js', 'package.json', 'error.log'];

    const filtered = manager.filterPaths(paths);
    expect(filtered).toEqual(['src/index.js']);
  });
});

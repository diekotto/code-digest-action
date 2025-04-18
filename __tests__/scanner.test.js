const { FileScanner } = require('../lib/scanner');
const { GitIgnoreManager } = require('../lib/gitignore');
const { createMockFs } = require('./test-utils');

describe('FileScanner', () => {
  let restoreFs;
  let ignoreManager;

  beforeEach(async () => {
    restoreFs = createMockFs();
    ignoreManager = await new GitIgnoreManager().initialize();
  });

  afterEach(() => {
    restoreFs();
  });

  test('should scan a directory and process its files', async () => {
    const scanner = new FileScanner();
    const { digest, stats } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
      options: { includeDotFiles: true },
    });

    // Should include files from src and .github directories
    const srcIndexFile = digest.find(file => file.path === 'src/index.js');
    const helperFile = digest.find(file => file.path === 'src/utils/helper.js');
    const ciYmlFile = digest.find(file => file.path === '.github/workflows/ci.yml');

    expect(srcIndexFile).toBeDefined();
    expect(helperFile).toBeDefined();
    expect(ciYmlFile).toBeDefined();

    // Should have expected content
    expect(srcIndexFile.content).toBe('console.log("Hello World");');
    expect(helperFile.content).toBe('function helper() { return true; }');
    expect(ciYmlFile.content).toBe('name: CI\non: push');

    // Should not include files from .git directory
    const gitHeadFile = digest.find(file => file.path.startsWith('.git/'));
    expect(gitHeadFile).toBeUndefined();

    // Should not include files from node_modules (because of .gitignore)
    const nodeModulesFile = digest.find(file => file.path.startsWith('node_modules/'));
    expect(nodeModulesFile).toBeUndefined();

    // Stats should be accurate
    expect(stats.filesProcessed).toBeGreaterThan(0);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.errors).toEqual([]);
  });

  test('should respect maxFileSize option', async () => {
    // Create a file larger than the max size
    restoreFs();
    restoreFs = createMockFs({
      'large-file.txt': 'X'.repeat(2000),
      'small-file.txt': 'Small content',
    });

    const scanner = new FileScanner({
      maxFileSize: 1000, // 1000 bytes
    });

    const { digest } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
    });

    const largeFile = digest.find(file => file.path === 'large-file.txt');
    const smallFile = digest.find(file => file.path === 'small-file.txt');

    expect(largeFile).toBeUndefined();
    expect(smallFile).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    // Mock fs.readFile to throw an error for a specific file
    const fs = require('fs').promises;
    const originalReadFile = fs.readFile;

    fs.readFile = jest.fn((path, options) => {
      if (path.includes('index.js')) {
        throw new Error('Mock file read error');
      }
      return originalReadFile(path, options);
    });

    const scanner = new FileScanner();
    const { stats } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
    });

    // Should have recorded the error
    expect(stats.errors.length).toBeGreaterThan(0);
    expect(stats.errors[0].error).toContain('Mock file read error');

    // Restore original method
    fs.readFile = originalReadFile;
  });

  test('should exclude dot files when includeDotFiles is false', async () => {
    // Setup a mock filesystem with some dot files
    restoreFs();
    restoreFs = createMockFs({
      '.env': 'SECRET=value',
      '.config': 'some config',
      'regular-file.txt': 'Regular content',
    });

    // Create scanner with default options (includeDotFiles: false)
    const scanner = new FileScanner();
    const { digest } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
    });

    // Should not include dot files
    const dotEnvFile = digest.find(file => file.path === '.env');
    const dotConfigFile = digest.find(file => file.path === '.config');
    const regularFile = digest.find(file => file.path === 'regular-file.txt');

    expect(dotEnvFile).toBeUndefined();
    expect(dotConfigFile).toBeUndefined();
    expect(regularFile).toBeDefined();
  });

  test('should include dot files when includeDotFiles is true', async () => {
    // Setup a mock filesystem with some dot files
    restoreFs();
    restoreFs = createMockFs({
      '.env': 'SECRET=value',
      '.config': 'some config',
      'regular-file.txt': 'Regular content',
    });

    // Create scanner with includeDotFiles: true
    const scanner = new FileScanner({
      includeDotFiles: true,
    });
    const { digest } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
    });

    // Should include dot files
    const dotEnvFile = digest.find(file => file.path === '.env');
    const dotConfigFile = digest.find(file => file.path === '.config');
    const regularFile = digest.find(file => file.path === 'regular-file.txt');

    expect(dotEnvFile).toBeDefined();
    expect(dotConfigFile).toBeDefined();
    expect(regularFile).toBeDefined();
  });

  test('should always exclude .git directory regardless of includeDotFiles setting', async () => {
    // Setup a mock filesystem with .git files
    restoreFs();
    restoreFs = createMockFs({
      '.git': {
        HEAD: 'ref: refs/heads/main',
        config: 'git config content',
      },
      '.env': 'SECRET=value',
    });

    // Test with includeDotFiles: true
    const scanner = new FileScanner({
      includeDotFiles: true,
    });
    const { digest } = await scanner.scanDirectory({
      dirPath: process.cwd(),
      ignoreManager,
    });

    // Should include .env but not .git files
    const dotEnvFile = digest.find(file => file.path === '.env');
    const gitHeadFile = digest.find(file => file.path === '.git/HEAD');
    const gitConfigFile = digest.find(file => file.path === '.git/config');

    expect(dotEnvFile).toBeDefined();
    expect(gitHeadFile).toBeUndefined();
    expect(gitConfigFile).toBeUndefined();
  });
});

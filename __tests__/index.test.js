const { CodeDigest } = require('../lib/index');
const { createMockFs } = require('./test-utils');

describe('CodeDigest', () => {
  let restoreFs;

  beforeEach(() => {
    restoreFs = createMockFs();
  });

  afterEach(() => {
    restoreFs();
  });

  test('should require initialization before use', async () => {
    const digest = new CodeDigest();

    await expect(async () => {
      await digest.generateDigest({ directory: process.cwd() });
    }).rejects.toThrow('CodeDigest not initialized');
  });

  test('should generate a complete digest', async () => {
    const digest = await new CodeDigest().initialize();
    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Check that all parts of the digest are present
    expect(result.metadata).toBeDefined();
    expect(result.files).toBeDefined();
    expect(result.tree).toBeDefined();

    // Verify metadata
    expect(result.metadata.directory).toBe(process.cwd());
    expect(result.metadata.executionTime).toBeDefined();
    expect(result.metadata.stats.filesProcessed).toBeGreaterThan(0);

    // Verify files digest
    expect(result.files.text).toContain('src/index.js');
    expect(result.files.text).toContain('console.log("Hello World")');
    expect(result.files.json).toBeInstanceOf(Array);

    // Verify tree
    expect(result.tree.text).toContain('Directory structure:');
    expect(result.tree.text).toContain('src/');
    expect(result.tree.json).toBeDefined();
    expect(result.tree.json.name).toBe(require('path').basename(process.cwd()));
  });

  test('should generate only the directory tree', async () => {
    const digest = await new CodeDigest().initialize();
    const result = await digest.generateTree({
      directory: process.cwd(),
    });

    expect(result.text).toContain('Directory structure:');
    expect(result.json).toBeDefined();
  });

  test('should scan directory without generating tree', async () => {
    const digest = await new CodeDigest().initialize();
    const result = await digest.scanDirectory({
      directory: process.cwd(),
    });

    expect(result.files).toBeInstanceOf(Array);
    expect(result.stats).toBeDefined();
    expect(result.stats.filesProcessed).toBeGreaterThan(0);
  });

  test('should always ignore .git directory', async () => {
    const digest = await new CodeDigest({
      includeDotFiles: true, // Even with this set to true
    }).initialize();

    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Should not contain any .git files in the digest
    const gitFile = result.files.json.find(file => file.path.startsWith('.git/'));
    expect(gitFile).toBeUndefined();

    // Should not contain .git directory in the tree
    expect(result.tree.text).not.toContain('.git/');
  });

  test('should respect configuration options', async () => {
    const digest = await new CodeDigest({
      maxFileSize: 100, // 100 bytes
      ignorePatterns: ['*.js'], // Ignore JavaScript files
    }).initialize();

    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Should not contain JavaScript files
    const jsFile = result.files.json.find(file => file.path.endsWith('.js'));
    expect(jsFile).toBeUndefined();
  });

  test('should normalize execution time', () => {
    const digest = new CodeDigest();

    // Test milliseconds format
    const msTime = digest.normalizeExecutionTime(Date.now() + 500, Date.now());
    expect(msTime).toMatch(/\d+ ms/);

    // Test seconds format
    const secTime = digest.normalizeExecutionTime(Date.now() + 1500, Date.now());
    expect(secTime).toMatch(/\d+\.\d+ seconds/);
  });

  test('should have consistent behavior between tree and digest for dot files', async () => {
    // Setup a mock filesystem with dot files
    restoreFs();
    restoreFs = createMockFs({
      '.env': 'SECRET=value',
      '.config': 'some config',
      'regular-file.txt': 'Regular content',
      '.git': {
        HEAD: 'ref: refs/heads/main',
      },
    });

    // Test with default options (includeDotFiles: false)
    const digest = await new CodeDigest().initialize();
    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Tree should not contain dot files
    expect(result.tree.text).not.toContain('.env');
    expect(result.tree.text).not.toContain('.config');
    expect(result.tree.text).not.toContain('.git');
    expect(result.tree.text).toContain('regular-file.txt');

    // Digest should also not contain dot files
    const dotEnvFile = result.files.json.find(file => file.path === '.env');
    const dotConfigFile = result.files.json.find(file => file.path === '.config');
    const gitHeadFile = result.files.json.find(file => file.path === '.git/HEAD');
    const regularFile = result.files.json.find(file => file.path === 'regular-file.txt');

    expect(dotEnvFile).toBeUndefined();
    expect(dotConfigFile).toBeUndefined();
    expect(gitHeadFile).toBeUndefined();
    expect(regularFile).toBeDefined();
  });

  test('should include dot files in both tree and digest when includeDotFiles is true', async () => {
    // Setup a mock filesystem with dot files
    restoreFs();
    restoreFs = createMockFs({
      '.env': 'SECRET=value',
      '.config': 'some config',
      'regular-file.txt': 'Regular content',
      '.git': {
        HEAD: 'ref: refs/heads/main',
      },
    });

    // Test with includeDotFiles: true
    const digest = await new CodeDigest({
      includeDotFiles: true,
    }).initialize();
    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Tree should contain dot files
    expect(result.tree.text).toContain('.env');
    expect(result.tree.text).toContain('.config');
    expect(result.tree.text).not.toContain('.git/'); // .git still excluded
    expect(result.tree.text).toContain('regular-file.txt');

    // Digest should also contain dot files
    const dotEnvFile = result.files.json.find(file => file.path === '.env');
    const dotConfigFile = result.files.json.find(file => file.path === '.config');
    const gitHeadFile = result.files.json.find(file => file.path === '.git/HEAD');
    const regularFile = result.files.json.find(file => file.path === 'regular-file.txt');

    expect(dotEnvFile).toBeDefined();
    expect(dotConfigFile).toBeDefined();
    expect(gitHeadFile).toBeUndefined(); // .git still excluded
    expect(regularFile).toBeDefined();
  });

  test('should handle nested dot directories and files consistently', async () => {
    // Setup a mock filesystem with nested dot directories and files
    restoreFs();
    restoreFs = createMockFs({
      '.config': {
        '.nested': 'nested dot file',
        'regular.json': '{"setting": "value"}',
      },
      src: {
        '.env.local': 'LOCAL=true',
        'index.js': 'console.log("test")',
      },
    });

    // Test with default options (includeDotFiles: false)
    const digest = await new CodeDigest().initialize();
    const result = await digest.generateDigest({
      directory: process.cwd(),
    });

    // Both tree and digest should exclude all dot files/directories
    expect(result.tree.text).not.toContain('.config');
    expect(result.tree.text).toContain('src/');
    expect(result.tree.text).not.toContain('.env.local');
    expect(result.tree.text).toContain('index.js');

    // Check digest
    const configNestedFile = result.files.json.find(file => file.path === '.config/.nested');
    const configRegularFile = result.files.json.find(file => file.path === '.config/regular.json');
    const srcEnvFile = result.files.json.find(file => file.path === 'src/.env.local');
    const srcIndexFile = result.files.json.find(file => file.path === 'src/index.js');

    expect(configNestedFile).toBeUndefined();
    expect(configRegularFile).toBeUndefined();
    expect(srcEnvFile).toBeUndefined();
    expect(srcIndexFile).toBeDefined();
  });
  describe('CodeDigest edge cases', () => {
    test('should correctly handle mixed dotfiles scenario', async () => {
      // Create a complex structure with various dotfile patterns
      restoreFs();
      restoreFs = createMockFs({
        // Regular files
        'normal.txt': 'normal content',
        // Dot files
        '.hidden': 'hidden content',
        // Files with dots in name but not dot files
        'config.json': '{"key": "value"}',
        'test.js': 'console.log("test")',
        // Dot files in subdirectories
        config: {
          '.env': 'ENV=production',
          'settings.json': '{"debug": false}',
        },
        // Dot directories with normal files
        '.vscode': {
          'settings.json': '{"editor.formatOnSave": true}',
        },
        // Special case: .git directory (should always be ignored)
        '.git': {
          HEAD: 'ref: refs/heads/main',
        },
        // Files with multiple dots
        'readme.md.backup': 'backup content',
        // Hidden file with extension
        '.npmrc.local': 'registry=...',
      });

      // First test: includeDotFiles: false (default)
      const defaultDigest = await new CodeDigest().initialize();
      const defaultResult = await defaultDigest.generateDigest({
        directory: process.cwd(),
      });

      // Check tree: should only show non-dot files and directories
      expect(defaultResult.tree.text).toContain('normal.txt');
      expect(defaultResult.tree.text).toContain('config.json');
      expect(defaultResult.tree.text).toContain('test.js');
      expect(defaultResult.tree.text).toContain('config/');
      expect(defaultResult.tree.text).toContain('settings.json');
      expect(defaultResult.tree.text).toContain('readme.md.backup');

      // Should NOT contain dot files/directories
      expect(defaultResult.tree.text).not.toContain('.hidden');
      expect(defaultResult.tree.text).not.toContain('.env');
      expect(defaultResult.tree.text).not.toContain('.vscode');
      expect(defaultResult.tree.text).not.toContain('.git');
      expect(defaultResult.tree.text).not.toContain('.npmrc.local');

      // Check digest files: same patterns should apply
      const hiddenFile = defaultResult.files.json.find(file => file.path === '.hidden');
      const vscodeSetting = defaultResult.files.json.find(file => file.path === '.vscode/settings.json');
      const configEnv = defaultResult.files.json.find(file => file.path === 'config/.env');
      const normalFile = defaultResult.files.json.find(file => file.path === 'normal.txt');
      const configJson = defaultResult.files.json.find(file => file.path === 'config.json');

      expect(hiddenFile).toBeUndefined();
      expect(vscodeSetting).toBeUndefined();
      expect(configEnv).toBeUndefined();
      expect(normalFile).toBeDefined();
      expect(configJson).toBeDefined();

      // Second test: includeDotFiles: true
      const dotFilesDigest = await new CodeDigest({
        includeDotFiles: true,
      }).initialize();
      const dotFilesResult = await dotFilesDigest.generateDigest({
        directory: process.cwd(),
      });

      // Check tree: should include dot files/directories (except .git)
      expect(dotFilesResult.tree.text).toContain('.hidden');
      expect(dotFilesResult.tree.text).toContain('.env');
      expect(dotFilesResult.tree.text).toContain('.vscode/');
      expect(dotFilesResult.tree.text).toContain('.npmrc.local');
      expect(dotFilesResult.tree.text).not.toContain('.git/');

      // Check digest files: should include dot files (except .git)
      const dotHiddenFile = dotFilesResult.files.json.find(file => file.path === '.hidden');
      const dotVscodeSetting = dotFilesResult.files.json.find(file => file.path === '.vscode/settings.json');
      const dotConfigEnv = dotFilesResult.files.json.find(file => file.path === 'config/.env');
      const dotNpmrcLocal = dotFilesResult.files.json.find(file => file.path === '.npmrc.local');
      const gitHead = dotFilesResult.files.json.find(file => file.path === '.git/HEAD');

      expect(dotHiddenFile).toBeDefined();
      expect(dotVscodeSetting).toBeDefined();
      expect(dotConfigEnv).toBeDefined();
      expect(dotNpmrcLocal).toBeDefined();
      expect(gitHead).toBeUndefined();
    });
  });
});

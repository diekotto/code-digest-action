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
      directory: process.cwd() 
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
      directory: process.cwd() 
    });
    
    expect(result.text).toContain('Directory structure:');
    expect(result.json).toBeDefined();
  });
  
  test('should scan directory without generating tree', async () => {
    const digest = await new CodeDigest().initialize();
    const result = await digest.scanDirectory({ 
      directory: process.cwd() 
    });
    
    expect(result.files).toBeInstanceOf(Array);
    expect(result.stats).toBeDefined();
    expect(result.stats.filesProcessed).toBeGreaterThan(0);
  });
  
  test('should always ignore .git directory', async () => {
    const digest = await new CodeDigest({
      includeDotFiles: true // Even with this set to true
    }).initialize();
    
    const result = await digest.generateDigest({ 
      directory: process.cwd() 
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
      directory: process.cwd() 
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
});

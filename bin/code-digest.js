#!/usr/bin/env node

const { createDigest } = require('../lib');
const path = require('path');
const fs = require('fs').promises;

// Parse command line arguments
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .options({
    directory: {
      alias: 'd',
      describe: 'Directory to analyze',
      type: 'string',
      default: process.cwd(),
    },
    output: {
      alias: 'o',
      describe: 'Output directory for generated files',
      type: 'string',
      default: 'code-digest-output',
    },
    ignore: {
      alias: 'i',
      describe: 'Additional patterns to ignore (comma separated)',
      type: 'string',
    },
    gitignore: {
      describe: 'Path to custom .gitignore file',
      type: 'string',
      default: '.gitignore',
    },
    'max-size': {
      describe: 'Maximum file size in MB',
      type: 'number',
      default: 10,
    },
    'include-binary': {
      describe: 'Include binary files in the digest',
      type: 'boolean',
      default: false,
    },
    'include-dot': {
      describe: 'Include dot files in the tree',
      type: 'boolean',
      default: false,
    },
    format: {
      alias: 'f',
      describe: 'Output format (json or text)',
      choices: ['json', 'text', 'both'],
      default: 'both',
    },
  })
  .example('$0', 'Generate digest for current directory')
  .example('$0 -d ./src -o ./output', 'Generate digest for src directory')
  .example('$0 -i "*.log,*.tmp" --max-size 5', 'Ignore patterns and set max file size')
  .help().argv;

async function ensureOutputDirectory(outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory: ${error.message}`);
    process.exit(1);
  }
}

async function writeOutput(outputDir, data, format = 'both') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // Ensure output directory exists
    await ensureOutputDirectory(outputDir);

    // Write metadata
    const metadataPath = path.join(outputDir, `metadata-${timestamp}.json`);
    await fs.writeFile(metadataPath, JSON.stringify(data.metadata, null, 2));
    console.log(`✓ Metadata written to: ${metadataPath}`);

    // Write tree based on format
    if (format === 'text' || format === 'both') {
      const treePath = path.join(outputDir, `tree-${timestamp}.txt`);
      await fs.writeFile(treePath, data.tree.text);
      console.log(`✓ Tree (text) written to: ${treePath}`);
    }

    if (format === 'json' || format === 'both') {
      const treeJsonPath = path.join(outputDir, `tree-${timestamp}.json`);
      await fs.writeFile(treeJsonPath, JSON.stringify(data.tree.json, null, 2));
      console.log(`✓ Tree (JSON) written to: ${treeJsonPath}`);
    }

    // Write files digest based on format
    if (format === 'text' || format === 'both') {
      const digestPath = path.join(outputDir, `digest-${timestamp}.txt`);
      await fs.writeFile(digestPath, data.files.text);
      console.log(`✓ Files digest written to: ${digestPath}`);
    }

    if (format === 'json' || format === 'both') {
      const digestPath = path.join(outputDir, `digest-${timestamp}.json`);
      await fs.writeFile(digestPath, JSON.stringify(data.files.json, null, 2));
      console.log(`✓ Files digest written to: ${digestPath}`);
    }
  } catch (error) {
    console.error(`Error writing output: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('Starting code digest...');

    // Initialize code digest with CLI options
    const codeDigest = await createDigest({
      ignorePatterns: argv.ignore ? argv.ignore.split(',') : [],
      gitignorePath: argv.gitignore,
      maxFileSize: argv.maxSize * 1024 * 1024,
      includeBinaryFiles: argv.includeBinary,
      includeDotFiles: argv.includeDot,
    }).initialize();

    // Generate digest
    console.log(`Analyzing directory: ${argv.directory}`);
    const result = await codeDigest.generateDigest({
      directory: argv.directory,
    });

    // Write output files
    await writeOutput(argv.output, result, argv.format);

    // Print summary
    console.log('\nDigest Summary:');
    console.log(`- Files processed: ${result.metadata.stats.filesProcessed}`);
    console.log(`- Files skipped: ${result.metadata.stats.filesSkipped}`);
    console.log(`- Total size: ${(result.metadata.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Execution time: ${result.metadata.executionTime}ms`);

    if (result.metadata.stats.errors.length > 0) {
      console.log('\nWarning: Some files could not be processed:');
      result.metadata.stats.errors.forEach(error => {
        console.log(`- ${error.path}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Error generating digest:', error.message);
    process.exit(1);
  }
}

main();

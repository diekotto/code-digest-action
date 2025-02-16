# Code Digest CLI

A command-line tool to generate comprehensive digests of your codebase, including directory trees, file statistics, and metadata.

## Installation

```bash
npm install -g code-digest
```

## Usage

```bash
code-digest [options]
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|----------|
| `--directory` | `-d` | Directory to analyze | Current working directory |
| `--output` | `-o` | Output directory for generated files | `code-digest-output` |
| `--ignore` | `-i` | Additional patterns to ignore (comma separated) | - |
| `--gitignore` | - | Path to custom .gitignore file | `.gitignore` |
| `--max-size` | - | Maximum file size in MB | 10 |
| `--include-binary` | - | Include binary files in the digest | `false` |
| `--include-dot` | - | Include dot files in the tree | `false` |
| `--format` | `-f` | Output format (json, text, or both) | `both` |

## Examples

1. Generate digest for current directory:
```bash
code-digest
```

2. Generate digest for a specific directory with custom output location:
```bash
code-digest -d ./src -o ./output
```

3. Ignore specific patterns and set custom max file size:
```bash
code-digest -i "*.log,*.tmp" --max-size 5
```

4. Generate JSON-only output including binary and dot files:
```bash
code-digest --format json --include-binary --include-dot
```

## Output Files

The tool generates multiple files with a timestamp in the output directory:

- `metadata-{timestamp}.json`: Contains overall statistics and execution information
- `tree-{timestamp}.txt`: Text representation of the directory structure (if format includes 'text')
- `tree-{timestamp}.json`: JSON representation of the directory structure (if format includes 'json')
- `digest-{timestamp}.txt`: Detailed file information in text format (if format includes 'text')
- `digest-{timestamp}.json`: Detailed file information in JSON format (if format includes 'json')

### Output Format Details

#### Metadata File
Contains:
- Number of files processed
- Number of files skipped
- Total size of processed files
- Execution time
- Any errors encountered during processing

#### Tree Files
Provide a hierarchical view of your directory structure:
- Text format: ASCII tree representation
- JSON format: Nested object structure

#### Digest Files
Contain detailed information about each processed file:
- File path
- Size
- Type
- Other relevant metadata

## Error Handling

The tool will:
- Create output directories if they don't exist
- Skip files that exceed the maximum size limit
- Log errors for files that couldn't be processed
- Display a summary of any errors encountered during execution

## Exit Codes

- `0`: Successful execution
- `1`: Error occurred during execution

## Limitations

- Maximum file size is configurable but defaults to 10MB
- Binary files are excluded by default
- Dot files are excluded by default
- Follows .gitignore patterns by default

## Contributing

For bugs, feature requests, or contributions, please open an issue or pull request in the repository.

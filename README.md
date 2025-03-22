# Code Digest Generator

![GitHub Release](https://img.shields.io/github/v/release/diekotto/code-digest-action?logo=githubactions)
![Node](https://img.shields.io/badge/nodejs-v22-green?logo=nodedotjs)
![npm](https://img.shields.io/npm/v/@diekotto/code-digest)

A comprehensive tool for generating detailed code digests of your codebase, optimized for Large Language Model (LLM) context windows. Perfect for documentation, code analysis, and AI-assisted development.

## Features

- 📊 Provides a concise metadata summary
- 📝 Generates a detailed digest of your codebase
- 🌳 Creates a visual directory tree structure
- 🚀 Fast execution with Node.js
- 🔒 Secure artifact storage
- ⚙️ Configurable file ignoring patterns
- 🔄 Compatible with CI/CD workflows

## Usage Options

### Option 1: GitHub Action

Add the following step to your GitHub Actions workflow:

```yaml
- name: Generate Code Digest
  uses: diekotto/code-digest-action@v2
  with:
    directory: 'src'
    output-format: 'text'
```

### Option 2: CLI Tool via NPX

Run directly without installing:

```bash
npx @diekotto/code-digest --directory ./src --output ./output
```

### Option 3: Globally Installed CLI

Install globally:

```bash
npm install -g @diekotto/code-digest
```

Then use anywhere:

```bash
code-digest --directory ./src --format both
```

## Configuration

### GitHub Action Configuration

| Input             | Description                          | Required | Default                |
| ----------------- | ------------------------------------ | -------- | ---------------------- |
| `node-version`    | Node.js version to use               | No       | `'22'`                 |
| `directory`       | Directory to analyze                 | No       | `'.'`                  |
| `output-dir`      | Output directory for generated files | No       | `'code-digest-output'` |
| `ignore-patterns` | Additional patterns to ignore        | No       | `''`                   |
| `gitignore-path`  | Path to custom .gitignore file       | No       | `'.gitignore'`         |
| `max-file-size`   | Maximum file size in MB              | No       | `'10'`                 |
| `include-binary`  | Include binary files in the digest   | No       | `'false'`              |
| `include-dot`     | Include dot files in the tree        | No       | `'false'`              |
| `output-format`   | Output format (json, text, or both)  | No       | `'text'`               |
| `retention-days`  | Number of days to retain artifacts   | No       | `'90'`                 |

### CLI Options

| Option             | Alias | Description                                     | Default                   |
| ------------------ | ----- | ----------------------------------------------- | ------------------------- |
| `--directory`      | `-d`  | Directory to analyze                            | Current working directory |
| `--output`         | `-o`  | Output directory for generated files            | `code-digest-output`      |
| `--ignore`         | `-i`  | Additional patterns to ignore (comma separated) | -                         |
| `--gitignore`      | -     | Path to custom .gitignore file                  | `.gitignore`              |
| `--max-size`       | -     | Maximum file size in MB                         | 10                        |
| `--include-binary` | -     | Include binary files in the digest              | `false`                   |
| `--include-dot`    | -     | Include dot files in the tree                   | `false`                   |
| `--format`         | `-f`  | Output format (json, text, or both)             | `text`                    |

## Output Files

The tool generates multiple files with a timestamp in the output directory:

- `metadata-{timestamp}.json`: Contains overall statistics and execution information
- `tree-{timestamp}.txt`: Text representation of the directory structure (if format includes 'text')
- `tree-{timestamp}.json`: JSON representation of the directory structure (if format includes 'json')
- `digest-{timestamp}.txt`: Detailed file information in text format (if format includes 'text')
- `digest-{timestamp}.json`: Detailed file information in JSON format (if format includes 'json')

## Example Workflow

### GitHub Actions Workflow

```yaml
name: Generate Code Digest

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Code Digest
        uses: diekotto/code-digest-action@v2
        with:
          directory: 'src'
          output-format: 'both'
          ignore-patterns: 'node_modules,dist,coverage'

      - name: Download Digest Files
        uses: actions/download-artifact@v4
        with:
          name: code-digest-files
```

### CLI Usage Examples

1. Generate digest for current directory:

```bash
npx @diekotto/code-digest
```

2. Generate digest for a specific directory with custom output location:

```bash
npx @diekotto/code-digest -d ./src -o ./output
```

3. Ignore specific patterns and set custom max file size:

```bash
npx @diekotto/code-digest -i "*.log,*.tmp" --max-size 5
```

4. Generate JSON-only output including binary and dot files:

```bash
npx @diekotto/code-digest --format json --include-binary --include-dot
```

## Use Cases

- **Code Reviews**: Provide structured context for pull request reviews
- **Documentation**: Generate detailed codebase summaries
- **AI Integration**: Create optimized context for LLM-powered development tools
- **Archival**: Maintain searchable snapshots of your codebase

## Security

This tool:

- Uses specific versions of dependent actions (when used as a GitHub Action)
- Runs in an isolated environment
- Doesn't require any sensitive permissions
- Stores artifacts securely

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Diego Maroto](https://github.com/diekotto)

## Support

If you encounter any problems or have suggestions, please open an issue in the GitHub repository.

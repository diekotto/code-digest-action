# Code Digest Generator

![GitHub Release](https://img.shields.io/github/v/release/diekotto/code-digest-action?logo=githubactions)
![Node](https://img.shields.io/badge/nodejs-v22-green?logo=nodedotjs)

A GitHub Action that generates a comprehensive text digest of your codebase, optimized for Large Language Model (LLM) context windows. Perfect for documentation, code analysis, and AI-assisted development.

## Features

- 📊 Provides a concise metadata summary
- 📝 Generates a detailed digest of your codebase
- 🌳 Creates a visual directory tree structure
- 🚀 Fast execution with Node.js
- 🔒 Secure artifact storage
- ⚙️ Configurable file ignoring patterns
- 🔄 Compatible with CI/CD workflows

## Usage

Add the following step to your GitHub Actions workflow:

```yaml
- name: Generate Code Digest
  uses: diekotto/code-digest-action@v2
  with:
    directory: 'src'
    output-format: 'text'
```

## Configuration

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

## Outputs

The action generates the following artifacts:

1. A comprehensive digest containing all code content
2. A metadata overview including repository details and file count
3. A visual representation of your project's structure

Each artifact is independently downloadable from the GitHub Actions interface.

## Example Workflow

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

## Output Examples

### Directory Tree Structure

```
Directory structure:
└── your-project/
    ├── README.md
    ├── LICENSE
    ├── package.json
    └── src/
        └── main.js
```

### Code Summary

```
===============================
Code Digest
===============================
Generated: 2024-02-15T10:00:00.000Z
Repository: owner/repo
Branch: main
Commit: abc123
Files Processed: 42
===============================
```

## Use Cases

- **Code Reviews**: Provide structured context for pull request reviews
- **Documentation**: Generate detailed codebase summaries
- **AI Integration**: Create optimized context for LLM-powered development tools
- **Archival**: Maintain searchable snapshots of your codebase

## Security

This action:

- Uses specific versions of dependent actions
- Runs in an isolated environment
- Doesn't require any sensitive permissions
- Stores artifacts securely in GitHub's infrastructure

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Diego Maroto](https://github.com/diekotto)

## Support

If you encounter any problems or have suggestions, please open an issue in the GitHub repository.

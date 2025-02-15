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
  uses: diekotto/code-digest-action@v1
  with:
    # Optional: Specify Node.js version (default: '22')
    node-version: '22'
    # Optional: Set artifact retention period in days (default: '90')
    retention-days: '90'
    # Optional: Additional patterns to ignore (default: '.gitignore,node_modules,.git,.env*,*.log')
    ignore-patterns: '.gitignore,node_modules,.git,.env*,*.log'
    # Optional: Character separator for ignore patterns (default: ',')
    pattern-separator: ','
```

## Configuration

| Input               | Description                                      | Required | Default                                      |
| ------------------- | ------------------------------------------------ | -------- | -------------------------------------------- |
| `node-version`      | Node.js version to use                           | No       | `'22'`                                       |
| `retention-days`    | Number of days to retain the generated artifacts | No       | `'90'`                                       |
| `ignore-patterns`   | Additional patterns to ignore                    | No       | `'.gitignore,node_modules,.git,.env*,*.log'` |
| `pattern-separator` | Character to separate ignore patterns            | No       | `','`                                        |

## Outputs

The action generates three separate artifacts:

1. `code-digest`: A comprehensive digest containing all code content
2. `code-summary`: A metadata overview including repository details and file count
3. `directory-tree`: A visual representation of your project's structure

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
        uses: diekotto/code-digest-action@v1

      # Download specific artifacts as needed
      - name: Download Full Digest
        uses: actions/download-artifact@v4
        with:
          name: code-digest

      - name: Download Directory Tree
        uses: actions/download-artifact@v4
        with:
          name: directory-tree
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
- **Documentation**: Generate detailed codebase summaries and structure overviews
- **AI Integration**: Create optimized context for LLM-powered development tools
- **Archival**: Maintain searchable and structured snapshots of your codebase

## Security

This action:

- Uses specific versions of dependent actions
- Runs in an isolated environment
- Doesn't require any sensitive permissions
- Stores artifacts securely in GitHub's infrastructure

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Diego Maroto](https://github.com/diekotto)

## Support

If you encounter any problems or have suggestions, please open an issue in the GitHub repository.

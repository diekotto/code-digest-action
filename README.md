# Code Digest Generator

![GitHub Release](https://img.shields.io/github/v/release/diekotto/gitingest?logo=githubactions)
![Node](https://img.shields.io/badge/nodejs-v22-green?logo=nodedotjs)

A GitHub Action that generates a comprehensive text digest of your codebase, optimized for Large Language Model (LLM) context windows. Perfect for documentation, code analysis, and AI-assisted development.

## Features

- 📝 Generates a readable digest of your codebase
- 🚀 Fast execution with Node.js
- 🔒 Secure artifact storage
- ⚙️ Configurable retention period
- 🔄 Compatible with CI/CD workflows

## Usage

Add the following step to your GitHub Actions workflow:

```yaml
- name: Generate Code Digest
    uses: diekotto/gitingest@v1
  with:
    # Optional: Specify Node.js version (default: '22')
    node-version: '22'
    # Optional: Set artifact retention period in days (default: '90')
    retention-days: '90'
```

## Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|----------|
| `node-version` | Node.js version to use | No | `'22'` |
| `retention-days` | Number of days to retain the generated artifact | No | `'90'` |

## Output

The action generates a `code-digest.txt` file containing your codebase digest and uploads it as a workflow artifact named `code-digest`.

## Example Workflow

```yaml
name: Generate Code Digest

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate Code Digest
        uses: diekotto/gitingest@v1
        
      - name: Download Digest
        uses: actions/download-artifact@v4
        with:
          name: code-digest
```

## Use Cases

- **Code Reviews**: Provide context for pull request reviews
- **Documentation**: Generate codebase summaries
- **AI Integration**: Create context for LLM-powered development tools
- **Archival**: Maintain searchable snapshots of your codebase

## Security

This action:
- Uses specific versions of dependent actions
- Runs in an isolated environment
- Doesn't require any sensitive permissions
- Stores artifacts securely in GitHub's infrastructure

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

[Diego Maroto](https://github.com/diegomaroto)

## Support

If you encounter any problems or have suggestions, please open an issue in the GitHub repository.

# Contributing to Code Digest Generator

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md following the Keep a Changelog format
3. The PR will be merged once you have the sign-off of at least one maintainer

## Development Setup

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build for production
npm run build
```

## Questions?

Feel free to open an issue for any questions or concerns.

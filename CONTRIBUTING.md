# Contributing to Treasure Data Debugger

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- Chrome or Edge browser
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/treasuredata-debugger.git
   cd treasuredata-debugger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Load extension in browser**
   - Open `chrome://extensions` (or `edge://extensions`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/` folder

4. **Make your changes**
   - Edit files in `extension/` or `test/`
   - Run tests: `npm test`
   - Run linter: `npm run lint`
   - Format code: `npm run format`

5. **Reload extension**
   - Go to `chrome://extensions`
   - Click the reload icon for TD Debugger
   - Open DevTools and test your changes

## Code Style

### JavaScript
- Use ES2022+ features (modules, async/await, etc.)
- Follow ESLint rules (run `npm run lint`)
- Format with Prettier (run `npm run format`)
- Add JSDoc comments for all functions
- Use descriptive variable names

### File Organization
- `extension/` - Extension source code
- `test/` - Test files (Vitest)
- `docs/` - Documentation and assets
- `.github/workflows/` - CI/CD workflows

### Naming Conventions
- Files: `kebab-case.js`
- Functions: `camelCase()`
- Constants: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Place tests in `test/` directory
- Name test files `*.test.js`
- Use descriptive test names
- Test edge cases and error conditions
- Aim for 70%+ code coverage

### Test Structure
```javascript
import { describe, it, expect } from 'vitest';

describe('feature name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Pull Request Process

### Before Submitting
1. ✅ Run tests: `npm test`
2. ✅ Run linter: `npm run lint`
3. ✅ Format code: `npm run format`
4. ✅ Update documentation if needed
5. ✅ Add tests for new features
6. ✅ Update CHANGELOG.md

### PR Guidelines
- **Title**: Use clear, descriptive titles
  - ✅ "Add keyboard navigation to modals"
  - ❌ "Fix bug"
- **Description**: Explain what and why
  - What problem does this solve?
  - How does it solve it?
  - Any breaking changes?
- **Size**: Keep PRs focused and reasonably sized
- **Tests**: Include tests for new functionality
- **Documentation**: Update docs if behavior changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## Commit Messages

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(parser): add support for NDJSON format

fix(redaction): handle null values in nested objects

docs(readme): add installation instructions

test(panel): add tests for URL matching logic
```

## Code Review

### What We Look For
- ✅ Code quality and readability
- ✅ Test coverage
- ✅ Documentation
- ✅ Performance considerations
- ✅ Security implications
- ✅ Accessibility compliance

### Review Process
1. Automated checks run (CI)
2. Maintainer reviews code
3. Feedback provided
4. Changes requested if needed
5. Approval and merge

## Reporting Issues

### Bug Reports
Include:
- Extension version
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console errors

### Feature Requests
Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Impact on existing features

## Questions?

- 📖 Check [README.md](README.md) for basic usage
- 📖 Check [README-DEV.md](README-DEV.md) for architecture details
- 💬 Open a discussion on GitHub
- 🐛 Report bugs via GitHub Issues

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Treasure Data Debugger! 🎉

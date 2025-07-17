# Contributing to AI Health Companion

Thank you for your interest in contributing to AI Health Companion! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Git Workflow](#git-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Docker and Docker Compose
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/healthTracker.git
   cd healthTracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start PostgreSQL and Minio
   npm run docker:up
   
   # Run migrations
   npm run db:migrate
   
   # Seed database
   npm run db:seed
   npm run db:seed:flags
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Git Workflow

We follow a Git Flow branching strategy:

### Branch Naming Convention

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/urgent-fix` - Critical production fixes
- `release/version` - Release preparation

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add JWT refresh token support
fix(api): resolve meal logging validation error
docs(readme): update installation instructions
test(unit): add feature flag service tests
```

### Branching Strategy

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   # Create PR to develop
   ```

2. **Bug Fixes**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b bugfix/bug-description
   # Fix the bug
   git commit -m "fix: bug description"
   git push origin bugfix/bug-description
   # Create PR to develop
   ```

3. **Hotfixes**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/urgent-fix
   # Fix the issue
   git commit -m "fix: urgent fix description"
   git push origin hotfix/urgent-fix
   # Create PR to main AND develop
   ```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type - use `unknown` or proper types

### React

- Use functional components with hooks
- Prefer named exports over default exports
- Use proper prop types and interfaces
- Follow React best practices for performance

### File Organization

```
/app
├── /api          # API routes
├── /components   # Shared components
├── /context      # React contexts
├── /hooks        # Custom hooks
├── /styles       # Global styles and themes
└── /[pages]      # Page components

/lib
├── /services     # Business logic services
├── /middleware   # API middleware
└── /utils        # Utility functions

/tests
├── /unit         # Unit tests
├── /integration  # Integration tests
└── /e2e          # End-to-end tests
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase with `I` prefix (`IUserData`)

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

## Testing

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database operations
- **E2E Tests**: Test complete user workflows
- **Accessibility Tests**: Ensure WCAG 2.1 AA compliance

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# API tests only
npm run test:api

# Database integration tests
npm run test:db

# UI snapshot tests
npm run test:ui

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Writing Tests

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and error cases
- Maintain test coverage above 90%

## Pull Request Process

### Before Submitting

1. **Ensure Tests Pass**
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

2. **Update Documentation**
   - Update README if needed
   - Add JSDoc comments for new functions
   - Update API documentation

3. **Check Performance**
   - Run Lighthouse audit
   - Check bundle size
   - Verify no memory leaks

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
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Accessibility tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] No TypeScript errors

## Screenshots (if applicable)
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - Code coverage must not decrease
   - No security vulnerabilities

2. **Code Review**
   - At least 2 approvals required
   - Address all review comments
   - Ensure code quality standards

3. **Merge Strategy**
   - Squash and merge for feature branches
   - Rebase and merge for hotfixes
   - Delete branch after merge

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- `1.0.0` - Initial release
- `1.1.0` - New features
- `1.0.1` - Bug fixes

### Release Steps

1. **Prepare Release**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   # Update version in package.json
   # Update CHANGELOG.md
   git commit -m "chore: prepare release v1.0.0"
   ```

2. **Merge to Main**
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

3. **Deploy**
   - Automatic deployment via CI/CD
   - Monitor deployment health
   - Verify functionality

4. **Cleanup**
   ```bash
   git checkout develop
   git merge release/v1.0.0
   git push origin develop
   git branch -d release/v1.0.0
   ```

## Getting Help

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check `/docs` folder for detailed guides
- **Code Review**: Ask questions in PR comments

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to AI Health Companion! 🎉 
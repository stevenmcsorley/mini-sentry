# Apply Professional ESLint Configuration

## Priority: High - Ready

## Description
Implement the professional ESLint configuration created during the component audit to enforce React + TypeScript best practices across the codebase.

## Background
We have created a comprehensive ESLint configuration (`.eslintrc.professional.json`) that enforces:
- Arrow function components (no React.FC)
- Type-only imports
- Specific React event types
- Modern React patterns

## Acceptance Criteria
- [ ] Install `.eslintrc.professional.json` as the project's ESLint config
- [ ] Fix all ESLint violations in existing components
- [ ] Add ESLint to CI/CD pipeline to catch violations
- [ ] Configure pre-commit hooks with husky + lint-staged
- [ ] Update package.json scripts to include linting
- [ ] Document ESLint rules in CONTRIBUTING.md

## Technical Details
Files involved:
- `.eslintrc.professional.json` (already created)
- `package.json` (add husky, lint-staged dependencies)
- `.github/workflows/` (CI integration)

## Definition of Done
- ESLint runs without errors on all TypeScript files
- Pre-commit hooks prevent commits with lint errors
- CI fails if ESLint violations are found
- Team can easily run `npm run lint` and `npm run lint:fix`

## Estimate: 2 points
## Labels: `tech-debt`, `dx-improvement`, `high-priority`
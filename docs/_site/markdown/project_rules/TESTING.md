# Testing Guide for Agent Party

This document outlines the testing approach for the Agent Party project, focusing on reliable code through comprehensive testing and quality checks.

## Testing Philosophy

Following industry best practices, our testing approach prioritizes:

1. **100% Code Coverage**: All code must be fully tested.
2. **Quality First**: Tests run code quality checks to ensure consistent standards.
3. **Pre-commit Integration**: Tests align with pre-commit hooks to catch issues early.
4. **Reliability**: Small, testable increments validate components thoroughly.

## Running Tests

The project includes a flexible test runner script that can run various test types:

```bash
# Run all tests with coverage
python scripts/run_tests.py --coverage

# Run only unit tests
python scripts/run_tests.py --unit

# Run only integration tests
python scripts/run_tests.py --integration

# Run code quality tests (linting, typing, formatting)
python scripts/run_tests.py --quality

# Run all checks that would be performed by pre-commit
python scripts/run_tests.py --precommit-check
```

## Test Types

### Functional Tests

- **Unit Tests**: Test individual components in isolation
  - Located in `tests/unit/`
  - Fast, focused on specific functionality

- **Integration Tests**: Test component interactions
  - Located in `tests/integration/`
  - Validate system behavior with multiple components

### Code Quality Tests

Code quality tests ensure code adheres to project standards:

- **Ruff Linting**: Enforce code style and detect potential issues
- **Ruff Formatting**: Ensure consistent code formatting
- **Import Sorting**: Check proper import organization
- **Type Checking**: Validate proper type annotations with mypy
- **Debug Statements**: Detect and prevent debug statements in production code

## Pre-commit Integration

The test suite is designed to align with our pre-commit hooks. To ensure your code will pass pre-commit checks:

1. Run quality tests first: `python scripts/run_tests.py --quality`
2. Fix any issues identified by the quality tests
3. Run all tests with coverage: `python scripts/run_tests.py --coverage`
4. As a final step, run: `pre-commit run --all-files`

## Writing Tests

When writing new tests:

1. **Maintain Coverage**: Ensure all new code is covered by tests.
2. **Test Edge Cases**: Include tests for error conditions and edge cases.
3. **Use Fixtures**: Utilize pytest fixtures for test setup and teardown.
4. **Follow Patterns**: Follow existing test patterns for consistency.
5. **Mark Tests**: Use appropriate pytest markers for test categorization.

## Continuous Integration

All tests are run in CI when code is pushed. Pull requests will not be approved if:

1. Tests fail
2. Coverage decreases
3. Code quality checks fail

## Best Practices

- Write tests before implementation (Test-Driven Development)
- Keep tests small and focused
- Use descriptive test names that explain what is being tested
- Ensure tests are deterministic and don't depend on external state
- Document complex test scenarios

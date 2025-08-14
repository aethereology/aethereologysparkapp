# Testing Guide for SparkCreatives Donation Platform

## Overview

This guide covers the comprehensive testing strategy for the SparkCreatives donation management platform, including unit tests, integration tests, E2E tests, and automated CI/CD pipelines.

## Testing Architecture

### 1. API Testing (Python/FastAPI)
- **Framework**: pytest with async support
- **Coverage**: 50%+ requirement
- **Location**: `api/tests/`

#### Test Categories:
- **Unit Tests**: Individual function testing
- **Integration Tests**: Complete donation workflows
- **Security Tests**: Input validation, rate limiting, CORS

#### Running API Tests:
```bash
cd api

# Install dependencies
pip install -r requirements.txt

# Run all tests
python -m pytest -v

# Run with coverage
python -m pytest --cov=. --cov-report=html

# Run specific test categories
python -m pytest tests/unit/ -v
python -m pytest tests/integration/ -v
```

### 2. Frontend Testing (React/Next.js)
- **Framework**: Jest + React Testing Library
- **Location**: `web/__tests__/`

#### Test Categories:
- **Component Tests**: UI component functionality
- **API Library Tests**: Frontend API integration
- **Accessibility Tests**: WCAG compliance

#### Running Frontend Tests:
```bash
cd web

# Install dependencies
npm install

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 3. End-to-End Testing (Playwright)
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, Safari, Mobile
- **Location**: `web/e2e/`

#### Test Categories:
- **User Workflows**: Complete donation receipt journeys
- **API Integration**: Direct API endpoint testing
- **Cross-browser**: Compatibility testing
- **Performance**: Response time validation
- **Security**: XSS, injection protection

#### Running E2E Tests:
```bash
cd web

# Install Playwright
npm install @playwright/test
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## Test Coverage Requirements

### API Tests
- **Minimum Coverage**: 50%
- **Critical Paths**: 90%+ (receipt generation, email sending)
- **Security Tests**: All input validation and authentication

### Frontend Tests
- **Components**: 80%+ for critical UI components
- **API Integration**: 100% for API wrapper functions
- **Accessibility**: WCAG 2.1 AA compliance

### E2E Tests
- **Happy Path**: All primary user workflows
- **Error Scenarios**: Network failures, API errors, validation
- **Performance**: Response times under 3 seconds
- **Security**: XSS prevention, input sanitization

## Test Data and Mocking

### API Tests
- **Mock External Services**: Email providers, external APIs
- **Test Environment Variables**: Configured in `conftest.py`
- **Fixtures**: Donation and donor data samples

### Frontend Tests
- **Mock API Calls**: Using Jest mocks for fetch
- **Mock Next.js**: Router and navigation mocks
- **Component Mocking**: External library mocks

### E2E Tests
- **API Response Mocking**: Controlled test scenarios
- **Environment**: Local development servers
- **Test Data**: Isolated test datasets

## Continuous Integration

### GitHub Actions Pipeline
1. **API Tests**: Unit and integration tests
2. **Frontend Tests**: Component and unit tests  
3. **E2E Tests**: Full application testing
4. **Security Scan**: Vulnerability assessment
5. **Quality Gates**: All tests must pass

### Pipeline Configuration:
- **Triggers**: Push to main/develop, Pull requests
- **Parallel Execution**: API and frontend tests run concurrently
- **Artifacts**: Test reports, coverage data
- **Notifications**: Slack integration for failures

## Local Development Testing

### Pre-commit Testing:
```bash
# Run all tests before committing
cd api && python -m pytest tests/test_basic.py
cd web && npm run test -- --passWithNoTests
cd web && npm run typecheck
cd web && npm run lint
```

### Test-Driven Development:
1. Write failing test
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Add edge case tests

## Performance Testing

### API Performance:
- Health endpoint: < 1 second response
- Receipt generation: < 3 seconds
- Concurrent request handling: 10+ simultaneous
- Rate limiting: 60 requests/minute per IP

### Frontend Performance:
- Initial load: < 3 seconds on 3G
- Time to interactive: < 5 seconds
- Bundle size: < 500KB initial, < 2MB total
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### E2E Performance:
- Complete receipt workflow: < 10 seconds
- API integration: < 2 seconds per call
- Cross-browser consistency: ±500ms variance

## Security Testing

### API Security:
- Input validation on all endpoints
- SQL injection prevention
- XSS protection in error messages
- Rate limiting enforcement
- CORS configuration validation

### Frontend Security:
- XSS prevention in user inputs
- Content Security Policy compliance
- Secure API communication (HTTPS)
- Error message sanitization

### E2E Security:
- Malicious payload rejection
- Authentication bypass attempts
- Session management validation

## Test Environment Setup

### Development Environment:
- API: `http://localhost:8080`
- Frontend: `http://localhost:3001`
- Test database: In-memory or local SQLite

### CI Environment:
- Containerized services
- Isolated test databases
- Mock external services
- Environment variable injection

### Production-like Testing:
- Staging environment mirroring production
- Real external service integration
- Performance under load
- Security penetration testing

## Debugging Tests

### API Test Debugging:
```bash
# Run single test with verbose output
python -m pytest tests/test_basic.py::test_health_endpoint_basic -v -s

# Run with pdb debugger
python -m pytest --pdb tests/test_basic.py::test_health_endpoint_basic
```

### Frontend Test Debugging:
```bash
# Run single test
npm test -- --testNamePattern="should render correctly"

# Debug mode
npm test -- --no-coverage --watchAll=false
```

### E2E Test Debugging:
```bash
# Run with browser UI visible
npm run test:e2e:headed

# Debug mode with Playwright inspector
npx playwright test --debug

# Record new tests
npx playwright codegen localhost:3001
```

## Test Maintenance

### Regular Tasks:
- Update test dependencies monthly
- Review and update test data quarterly
- Performance baseline validation
- Browser compatibility updates

### Test Health Monitoring:
- Flaky test identification and fixing
- Test execution time optimization
- Coverage gap analysis
- Test redundancy elimination

## Best Practices

### API Testing:
- Test behavior, not implementation
- Use realistic test data
- Mock external dependencies
- Test error scenarios thoroughly
- Validate response schemas

### Frontend Testing:
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByText)
- Test accessibility features
- Mock network requests
- Test loading and error states

### E2E Testing:
- Keep tests independent and isolated
- Use page object pattern for reusability
- Test critical user journeys first
- Balance speed vs. coverage
- Stable selectors over brittle ones

### General Practices:
- Clear, descriptive test names
- Single responsibility per test
- Fast feedback loops
- Deterministic test results
- Regular test maintenance
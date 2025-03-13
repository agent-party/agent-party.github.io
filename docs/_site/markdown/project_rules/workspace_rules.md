# Agent Party Workspace Rules

## Testing Strategy

1. **Module-Focused Testing**
   - Complete one module's test coverage before moving to the next
   - Begin with smaller, simpler modules to build momentum
   - Create both positive and negative test cases for all functionality

2. **Quality Metrics**  
   - Use pytest with coverage.py to measure test coverage
   - Configure test reporting in CI/CD pipeline
   - Implement property-based testing for complex data structures

3. **Neo4j Testing**
   - Use test fixtures for database setup and teardown
   - Mock Neo4j connections in unit tests
   - Create integration tests with test containers

## Code Structure

1. **Service Architecture**
   - Register all services with ServiceRegistry
   - Use Protocol interfaces for all service dependencies
   - Apply proper service scoping (singleton, transient, scoped)

2. **Repository Implementation**
   - Create repository interfaces before implementation
   - Optimize Neo4j queries with proper indexing
   - Implement proper transaction management

3. **Event Processing**
   - Define event schemas with Pydantic
   - Implement idempotent event handlers
   - Create proper error recovery for failed events

## Sprint Implementation

1. **Sprint Focus**
   - Follow the defined sprint structure in docs/sprints
   - Complete all components with 100% test coverage
   - Create documentation for completed components

2. **Performance Considerations**
   - Add @log_execution_time decorator to critical methods
   - Create benchmarks for database operations
   - Optimize graph traversal queries

3. **Review Checklist**
   - Verify all tests are passing
   - Confirm code meets type checking requirements
   - Check docstrings are complete and accurate
   - Ensure no debug code remains

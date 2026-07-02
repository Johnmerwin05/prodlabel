# AI Project Context

Before making any changes, additions, refactors, code reviews, bug fixes, database modifications, API development, UI implementation, or architectural decisions, read and follow the documents below in order:

## Required Documents

- docs/tech-stack.md
- docs/coding-standards.md
- docs/frontend-architecture.md
- docs/backend-architecture.md
- docs/api-rules.md
- docs/security-rules.md
- docs/ui-guidelines.md
- docs/database-conventions.md
- docs/deployment.md

## General Rules

- Always follow the architecture, standards, conventions, and requirements defined in the referenced documents.
- Treat these documents as the single source of truth for the project.
- Do not introduce new patterns, libraries, frameworks, or dependencies unless explicitly requested.
- Maintain consistency with the existing codebase.
- Maintain backward compatibility whenever possible.
- Generate production-ready, scalable, secure, and maintainable code.
- Follow SOLID, DRY, KISS, and Clean Architecture principles.
- Prefer reusable and modular components over duplicated implementations.
- Follow existing naming conventions, folder structures, and coding standards.

## Frontend Requirements

- Follow the standards defined in `frontend-architecture.md` and `ui-guidelines.md`.
- Use React with TypeScript.
- Use Shadcn UI components whenever applicable.
- Preserve existing UI and UX patterns unless explicitly instructed to redesign.
- Implement loading states, skeletons, empty states, and error states.
- Ensure responsive and accessible interfaces.
- Use React Query, React Hook Form, and Zod according to project standards.

## Backend Requirements

- Follow the standards defined in `backend-architecture.md`, `api-rules.md`, and `security-rules.md`.
- Use Laravel API best practices.
- Use Form Requests for validation.
- Use API Resources for responses.
- Follow Service and Repository patterns where defined.
- Implement proper exception handling and logging.
- Use Redis and Reverb according to project architecture.

## Database Requirements

- Follow all conventions defined in `database-conventions.md`.
- Create proper indexes and foreign key constraints.
- Preserve data integrity and normalization.
- Avoid breaking existing relationships and migrations.

## Security Requirements

- Validate and sanitize all inputs.
- Enforce authorization and authentication checks.
- Prevent common vulnerabilities including XSS, CSRF, SQL Injection, mass assignment, and insecure direct object references.
- Follow all rules defined in `security-rules.md`.

## Deployment Requirements

- Follow deployment and environment standards defined in `deployment.md`.
- Ensure changes are production-safe and environment-aware.

## UI Modification Policy

Unless explicitly requested:

- Do not redesign existing pages.
- Do not modify layouts unnecessarily.
- Do not replace existing UI patterns.
- Focus on functionality, maintainability, performance, and code quality improvements.

## Expected Output

All generated code must be:

- Production-ready
- Fully typed
- Secure
- Scalable
- Maintainable
- Well-structured
- Consistent with project standards
- Free of unnecessary code duplication

Always review your implementation against the referenced documents before completing any task.

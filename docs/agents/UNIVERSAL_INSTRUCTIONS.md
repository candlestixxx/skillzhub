# Universal Agent Instructions

These instructions are the single source of truth for all AI agents (Jules, Claude, Gemini, GPT, etc.) working on the SkillzHub repository.

## 1. Versioning Protocol
* **MANDATORY**: Every session that modifies the codebase, database schema, or project documentation MUST result in a version bump.
* **VERSION File**: The primary version string is stored in the root `VERSION` file. Increment the patch version (e.g., v0.1.12 -> v0.1.13) for each session.
* **Commit Messages**: The version number MUST be included in the git commit message (e.g., `feat: implement S3 upload (v0.1.2)`).
* **Synchronization**: Ensure any internal version references (e.g., in UI footers) are synchronized with the `VERSION` file.

## 2. Documentation Standards
* **ROADMAP.md & TODO.md**: Keep these files updated meticulously. Check off completed items; do not delete them. Add new findings or technical debt immediately to `TODO.md`.
* **CHANGELOG.md**: Maintain a detailed log of changes for every version. Be descriptive about what was implemented and why.
* **MEMORY.md**: Record ongoing observations, architectural constraints, and user preferences discovered during development.
* **LIBRARIES.md**: Document all major dependencies, their versions, and their roles in the project.

## 3. Code Quality & Style
* **Deep Commenting**: Comment code in extreme depth, explaining the "why" and the architectural reasoning behind complex blocks.
* **Self-Documentation**: If a block of code is entirely self-explanatory (e.g., standard boilerplate), leave it bare. Do not comment for the sake of commenting.
* **Refactoring**: Always look for ways to simplify and refactor existing code without losing functionality. Keep the repo clean and organized.

## 4. Operational Directives
* **Analyze First**: Before starting a task, perform a deep analysis of the project state and conversation history.
* **Verify Everything**: Always verify your changes using `read_file`, `list_files`, or by running tests. Do not assume a write was successful.
* **Service-Oriented Logic**: Favor keeping business logic in the `src/lib/services/` directory to ensure the API routes remain thin and maintainable.

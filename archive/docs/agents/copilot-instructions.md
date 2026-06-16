# Global Agent Instructions

The scope of these instructions applies to the entire repository. Read and follow these directives before making changes.

## 1. Versioning
* Every session that modifies code or project state MUST result in a version bump.
* Update the version string in the `VERSION` file.
* Update the `CHANGELOG.md` file describing the changes for that version.
* The version number MUST be referenced in the commit message (e.g., `feat: implement S3 upload (v0.1.2)`).

## 2. Documentation
* Maintain `ROADMAP.md` and `TODO.md` meticulously. Do not delete remaining items unless completed; check them off.
* Whenever you learn a new constraint or architectural quirk about this codebase, add it to `MEMORY.md`.
* Document dependencies and structural roles in `LIBRARIES.md`.

## 3. Code Style & Comments
* Comment code in extreme depth. Explain the "why" and the architectural reasoning behind a block.
* If a block of code is entirely self-explanatory, leave it bare. Do not comment for the sake of commenting.

## 4. Submodules
* If submodules are added, they must be documented in `LIBRARIES.md` with their repository URL, commit hash/version, and purpose.
* You must recursively update and push submodules when syncing the repository.

# Git Workflow

## Branch Strategy

- **`main`** — production releases only. Never commit or push directly.
- **`develop`** — integration branch. All feature branches are cut from here and PR'd back here.
- **`feature/<description>`** or **`PDX-<ticket>-<description>`** — feature/fix branches.

## Workflow for Every Change

1. Create a feature branch off `develop`:
   ```
   git checkout -b feature/my-change origin/develop
   ```
2. Make changes, commit on the feature branch.
3. Push the feature branch and open a PR targeting **`develop`**:
   ```
   git push -u origin feature/my-change
   gh pr create --base develop
   ```
4. After review and merge into `develop`, releases are cut from `develop` → `main`.

## Rules

- **Never push directly to `main` or `develop`.**
- Always open a PR for any change — no direct commits to integration branches.
- Branch names should be lowercase with hyphens.

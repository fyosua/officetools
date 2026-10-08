# Contributing

## Branch Naming

```
feat/<tool-name>    — new tool (e.g. feat/pdf-merge)
fix/<description>   — bug fix
docs/<description>  — documentation
chore/<description> — maintenance
```

## Commit Message Format

```
type(scope): description

Types: feat, fix, test, docs, chore, refactor, perf, security
Scope: the tool or module name (e.g. merge, auth, ui)
```

Examples:
```
feat(merge): implement PDF merge endpoint
test(split): add page range parsing tests
fix(auth): prevent session cookie fixation
docs: add API reference
```

## Pull Request Checklist

- [ ] TypeScript compiles (`cd .. && bunx tsc --noEmit`)
- [ ] Svelte frontend builds (`cd client && bun run build`)
- [ ] No hardcoded secrets
- [ ] CHANGELOG.md updated
- [ ] Manual smoke test in browser (login + tool run)

## Code Standards

- Functions ≤ 50 lines
- JSDoc comments on all exported functions
- TypeScript types on all function signatures
- One tool per file in `server/tools/`
- File naming: kebab-case (e.g. `pdf-to-jpg.ts`)
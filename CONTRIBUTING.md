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

- [ ] Tests pass (`python3 -m pytest tests/ -v`)
- [ ] Coverage ≥ 80% (`pytest --cov=tools`)
- [ ] Lint clean (`ruff check .`)
- [ ] Type check passes (`mypy .`)
- [ ] No hardcoded secrets
- [ ] CHANGELOG.md updated
- [ ] Manual smoke test in browser

## Code Standards

- Functions ≤ 50 lines
- Docstrings on all public API functions
- Type hints on all function signatures
- One tool per file in `tools/`
- Each tool has a corresponding test file in `tests/`

"""Guard: every op.execute() in migrations must send exactly ONE statement.

asyncpg (extended query protocol) rejects multiple commands per prepared
statement ("cannot insert multiple commands into a prepared statement"), so
multi-command strings and trailing semicolons break online migrations.
Semicolons inside $$...$$ dollar-quoting (e.g. function bodies) are fine.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

VERSIONS_DIR = Path(__file__).resolve().parents[1] / "alembic" / "versions"


def _single_statements_only(source: str) -> list[str]:
    violations: list[str] = []
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Call) and getattr(node.func, "attr", "") == "execute"):
            continue
        if not node.args or not isinstance(node.args[0], ast.Constant):
            continue
        sql = node.args[0].value
        if not isinstance(sql, str):
            continue
        stripped = re.sub(r"\$\$.*?\$\$", "", sql, flags=re.DOTALL)
        if ";" in stripped:
            preview = " ".join(sql.split())[:100]
            violations.append(preview)
    return violations


def test_migration_executes_are_single_statements():
    files = sorted(VERSIONS_DIR.glob("*.py"))
    assert files, "no migration files found"
    problems: dict[str, list[str]] = {}
    for path in files:
        bad = _single_statements_only(path.read_text())
        if bad:
            problems[path.name] = bad
    assert not problems, f"multi-statement op.execute() found: {problems}"

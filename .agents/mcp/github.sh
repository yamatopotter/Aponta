#!/usr/bin/env bash
# Wrapper do MCP github (usado principalmente pelo Antigravity).
#
# Por que existe: o Antigravity (diferente do Claude/Codex) não tem um mecanismo de
# "encaminhar env var local" no mcp_config — só um `env` que gravaria o valor no arquivo
# committed. Este wrapper lê o token do AMBIENTE em runtime (GITHUB_PERSONAL_ACCESS_TOKEN
# ou GITHUB_TOKEN) e faz exec do server, então o token NUNCA é gravado no repo.
#
# Referenciado em .agents/mcp_config.json como: {command: "bash", args: [".agents/mcp/github.sh"]}
# ⚠️ Depende do token estar no env de quem sobe o assistente (este projeto não usa mise —
# exporte GITHUB_TOKEN/GITHUB_PERSONAL_ACCESS_TOKEN no shell antes de subir o assistente).
# Sem o token, o server sobe sem auth (rate limit baixo) — não quebra o resto.
set -euo pipefail

export GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GITHUB_TOKEN:-}}"

exec npx -y @modelcontextprotocol/server-github

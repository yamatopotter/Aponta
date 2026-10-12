---
name: bash
description: Padrões de shell script — bash com shellcheck limpo, quoting rigoroso, set -euo pipefail, CLIs modernas (fd/rg/sd/bat), idempotência. Use ao escrever ou revisar scripts shell.
allowed-tools: Read, Grep
---

# Bash — padrões

Bash é (junto com TypeScript) a linguagem padrão para novos scripts.

## Esqueleto

```bash
#!/usr/bin/env bash
# Comentário de propósito no topo (o "porquê" do script)

set -euo pipefail
```

Este projeto não usa `mise` — scripts reutilizáveis vão para `package.json` > `scripts` (skill `new-task`), não para um diretório de tasks file-based.

## Regras de shellcheck (deve passar limpo)

- **Sempre cite variáveis**: `"$VAR"`, nunca `$VAR`; em expansões também: `"${var%-"${OS}"}"`.
- `grep -q` em vez de `[ -n "$(grep ...)" ]`.
- Agrupe redirecionamentos: `{ cmd1; cmd2; } >> arquivo`.
- `continue` apenas dentro de loop.
- Source opcional: anote `# shellcheck disable=SC1091`.
- `sd`/`rg` com aspas simples contendo `$`: anote `# shellcheck disable=SC2016`.
- Evite subshell em loops: `while read ...; done < <(find ...)` (process substitution), não `find | while`.

## CLIs modernas

Quando disponíveis no ambiente, prefira:

| Em vez de              | Use   |
| ---------------------- | ----- |
| `find`                 | `fd`  |
| `grep`                 | `rg`  |
| `sed`                  | `sd`  |
| `cat` (leitura humana) | `bat` |

JSON/YAML: `jq`/`yq`. HTTP: `xh` ou `curl`. Em scripts que precisam rodar em máquina crua (instaladores), fique no POSIX/coreutils.

## Idempotência

Scripts de setup/instalação devem convergir, não acumular:

- `mkdir -p`, `ln -sfn`, verificar antes de anexar (`grep -q "linha" arquivo || echo "linha" >> arquivo`).
- Rodar duas vezes = mesmo resultado, sem erro nem efeito duplicado (obrigatório em `prepare`, playbooks e instaladores).

## Segurança

- Nunca interpole entrada não confiável em `eval`/comandos.
- Limpeza com trap: `trap 'rm -rf "$TMP_DIR"' EXIT INT TERM`.
- Arquivos temporários no scratch do repo (`.tmp/`) ou `mktemp`, nunca espalhados.
- Sem segredos hardcoded — leia do ambiente (skill `env`).

## Estrutura

- Funções pequenas com nomes descritivos; `main` no final quando o script crescer.
- Mensagens de progresso claras (padrão: `echo "  → item"`).
- Script reutilizável e simples: adicione como script em `package.json` (skill `new-task`); lógica mais complexa (ex.: `prisma/seed.ts`, `worker/sync-worker.ts`) vai para um arquivo `.ts` rodado via `tsx`.

---
name: docs
description: Padrões de documentação — idioma pt-BR, Mermaid (nunca ASCII art) legível em tema escuro, README sempre atualizado, runbooks em docs/. Use ao escrever ou revisar documentação.
allowed-tools: Read, Grep
---

# Documentação

## Idioma

O idioma deste projeto é **português (pt-BR)** — vale para documentação, comentários no código e commits (skill `commit`). Termos técnicos em inglês são permitidos.

## Diagramas: Mermaid, nunca ASCII art

- Todo diagrama em blocos `mermaid` — renderiza no GitHub e nos viewers.
- **Legível em tema escuro** (padrão do projeto): use cores escuras e vibrantes com texto branco (`color:#fff`) via `style`; evite cores claras sem contraste (ex.: `#e1f5ff`).
- Cores consistentes entre diagramas (ex.: azul `#2563eb` para elementos principais, verde `#10b981`, laranja `#f59e0b`, vermelho `#ef4444` para erros).
- Um diagrama por conceito; prefira `flowchart`/`sequenceDiagram` simples a um mega-diagrama.

## README

- **Atualize o README junto** com qualquer mudança que afete uso, comandos ou estrutura do projeto — no mesmo commit/PR, não "depois".
- O README é a porta de entrada: instalação, comandos principais, visão geral. Detalhe vai para `docs/`.

## Estrutura

| Onde        | O quê                                                                               |
| ----------- | ----------------------------------------------------------------------------------- |
| `README.md` | Porta de entrada: o que é, como instalar, comandos, integração com o RHiD           |
| `AGENTS.md` | Regras para agentes (fonte única; `CLAUDE.md` referencia via `@AGENTS.md`, não é symlink) |
| `docs/`     | `ARQUITETURA.md` (visão técnica, modelo de dados, fluxos), `docs/integrations/` (docs de API externas, ex. swagger do RHiD) |

- Um runbook operacional descreve **passos executáveis** (comandos completos, caminhos reais), não teoria.
- Docs internos podem assumir contexto; docs públicos (README) não.

## Estilo

- Títulos curtos, seções pequenas; tabelas para fatos enumeráveis, prosa para explicação.
- Código de exemplo que **funciona** (colável), com placeholders mínimos.
- Sem screenshots do que pode ser expresso em texto/código/Mermaid.
- Nunca cole segredos, tokens ou dados pessoais em docs — nem como exemplo (um fictício "use `sk-...`" é ok; um valor real, nunca).

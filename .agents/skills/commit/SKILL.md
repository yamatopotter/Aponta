---
name: commit
description: Cria um commit git seguindo o estilo real do histórico do projeto — português, frase direta, sem gitmoji, sem prefixo de tipo. Use ao receber pedido para commitar.
allowed-tools: Bash, Read, Glob, Grep
user-invocable: true
---

# Criar Commit

Regras de commit deste projeto (`aponta`). **Sem gitmoji** e **sem prefixo de Conventional Commits** (`feat:`/`fix:`) — o histórico real usa uma frase direta em português, no imperativo, sem ponto final.

## Passos

### 1. Levantar informações (em paralelo)

```bash
git status                  # Arquivos modificados/não rastreados
git diff --staged --stat    # Resumo das mudanças staged
git diff --stat             # Resumo das mudanças unstaged
git log --oneline -10       # Referência de estilo
```

Se não houver mudanças (staged ou unstaged), informe e pare.

### 2. Staging

- Se há mudanças **staged**, use-as como base do commit.
- Se há mudanças **unstaged**, adicione os arquivos relevantes com `git add <arquivo>` — NUNCA `git add -A` ou `git add .`.
- **NUNCA adicione** arquivos com segredos (`.env`, credenciais, tokens, chaves) — cuidado especial com `.agents/mcp_config.json` se ele passar a ter credenciais reais.

### 3. Analisar

```bash
git diff --staged
```

Entenda a natureza da mudança (e o _porquê_) antes de escrever a mensagem.

### 4. Mensagem

**Idioma**: português.

**Formato**: frase direta, no imperativo, sem prefixo de tipo, sem gitmoji, sem ponto final — foco no _porquê_ ou no efeito da mudança, não numa descrição mecânica do diff.

Exemplos (do histórico real do projeto):

- `Corrige data da justificativa aparecendo um dia antes`
- `Corrige divergência de hoje, adiciona anexos e tipos configuráveis`
- `Loga a falha real do login via Zoho e respeita o data center da conta`
- `Usa X-Forwarded-Host pra montar o redirect_uri do login via Zoho`

### 5. Criar o commit

```bash
git commit -m "$(cat <<'EOF'
{mensagem}
EOF
)"
```

### 6. Verificar

Se um hook de pre-commit falhar: corrija o problema, faça o staging e crie um commit **NOVO** (não `--amend`). Após o sucesso, informe o hash e a mensagem.

## Regras

- **NUNCA** `--no-verify` ou `--no-gpg-sign`.
- `--amend` apenas em commit ainda não publicado e com pedido explícito.
- **NUNCA** faça push sem o usuário pedir.
- **NUNCA** crie commit vazio.
- **NUNCA** commite sem o usuário pedir.

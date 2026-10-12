---
name: deps-upgrade
description: Atualização segura de dependências — em grupos, lendo changelogs, verificando entre grupos. Use ao atualizar dependências.
allowed-tools: Read, Bash, Grep, Glob
user-invocable: true
---

# Atualização de Dependências

Upgrade é rotina, não heroísmo: grupos pequenos, verificação entre eles, leitura antes de saltar majors.

## Fluxo

1. **Inventário**: `npm outdated`.
2. **Agrupe** as atualizações:
   - patch/minor de deps diretas → um lote;
   - cada **major** → lote próprio, depois de ler o changelog/guia de migração (breaking changes listados na mensagem do PR/commit).
3. **Por lote**: atualiza → `npm run lint` → `npx tsc --noEmit` → build (`npm run build`) → commit (um commit por lote, mensagem em português, sem gitmoji, foco no porquê). Lote quebrado é revertido ou corrigido antes do próximo começar.
4. **Lockfile**: revise o diff do `package-lock.json` procurando saltos transitivos surpresa; nunca edite o lockfile à mão.

## Regras

- Nunca especifique versões ao adicionar/atualizar (padrão do projeto — ver AGENTS.md); deixe o `npm` escolher a última.
- Nunca misture um lote de upgrade com mudanças de feature no mesmo commit.
- Avisos de segurança (`npm audit`) furam a fila — trate-os primeiro e mencione-os explicitamente no relatório.

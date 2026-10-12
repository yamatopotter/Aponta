---
trigger: always_on
---

# Comandos Destrutivos Proibidos

NUNCA execute estes comandos sem aprovacao explicita do usuario:

## Git

- `git push --force`
- `git reset --hard`
- `git clean -fd`

## Sistema

- `rm -rf` (especialmente em /, /home, /etc)
- `chmod -R 777`
- `chown -R`

## Banco de Dados

- `DROP DATABASE`
- `DROP TABLE`
- `TRUNCATE`
- `DELETE` sem WHERE

## Deploy

- Build/push de imagem Docker de produção, ou qualquer deploy, sem aprovacao explicita

Se o usuario pedir algum destes comandos, SEMPRE confirme antes de executar.

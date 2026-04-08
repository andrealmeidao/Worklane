# Contributing

Obrigado por considerar contribuir com o Worklane.

## Como colaborar

1. Faça um fork do repositório.
2. Crie uma branch descritiva:

```bash
git checkout -b feat/nome-da-melhoria
```

3. Faça mudanças pequenas e focadas.
4. Garanta que o projeto continue buildando.
5. Abra um Pull Request com contexto claro.

## Padrões esperados

- manter consistência com a arquitetura atual
- evitar mudanças aleatórias ou refactors desnecessários
- preservar o fluxo principal do produto
- priorizar clareza, UX e estabilidade

## Antes de abrir PR

### Frontend

```bash
npm --prefix Frontend run build
```

### Prisma

```bash
npx prisma validate
```

## Commits

Prefira mensagens objetivas, por exemplo:

- `feat: add board filters`
- `fix: handle invalid session token`
- `docs: update setup instructions`

## Issues e melhorias

Sugestões de melhoria são bem-vindas, principalmente em:

- UX do board
- performance do frontend
- padronização de tratamento de erros
- testes automatizados
- deploy e observabilidade

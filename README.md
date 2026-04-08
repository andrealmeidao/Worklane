# Worklane

Kanban SaaS com foco em gestão visual de trabalho, colaboração em equipe e experiência moderna de produto.

O projeto foi construído como uma aplicação fullstack completa, com autenticação JWT, boards colaborativos, tarefas com drag and drop, comentários, membros com RBAC, perfil, configurações persistidas e refinamento de UI/UX para uma experiência mais próxima de um produto real.

## Visão geral

O Worklane foi pensado para simular um fluxo de trabalho usado diariamente por equipes:

- criação e gestão de boards
- colunas com ordem persistida
- tarefas com prioridade, prazo e responsável
- drag and drop de tarefas e colunas
- comentários por tarefa
- membros por board com permissões
- perfil e configurações persistidas
- dark mode e microinterações no frontend

## Stack

### Frontend

- React
- Vite
- Tailwind CSS
- dnd-kit
- Axios
- React Router
- React Hot Toast

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- JWT
- bcrypt

## Principais funcionalidades

### Autenticação e conta

- login e registro
- sessão persistida
- proteção de rotas com JWT
- perfil com `nome`, `bio`, `cargo` e `avatarUrl`
- configurações com `tema` e `notificações`

### Boards e colaboração

- criar, editar e excluir boards
- sistema de membros por board
- RBAC com `OWNER`, `ADMIN` e `MEMBER`
- apenas owner pode excluir board
- admins e owners gerenciam membros

### Kanban

- criar, editar e excluir colunas
- exclusão de coluna apenas quando estiver vazia
- reordenação de colunas com persistência
- criar, editar e excluir tarefas
- drag and drop de tarefas entre colunas
- prioridade, prazo e responsável
- filtros por responsável, prioridade e prazo

### Experiência de produto

- dashboard com métricas e cards de boards
- board horizontal com scroll
- microinterações de hover e drag
- modais com animação
- empty states e loading states
- dark mode estruturado
- lembrança do último board acessado

## Estrutura do projeto

```text
Worklane/
├─ Backend/
│  └─ src/
│     ├─ controllers/
│     ├─ middlewares/
│     ├─ routes/
│     ├─ services/
│     └─ utils/
├─ Frontend/
│  └─ src/
│     ├─ components/
│     ├─ context/
│     ├─ lib/
│     └─ pages/
├─ prisma/
│  ├─ migrations/
│  └─ schema.prisma
└─ prisma.config.ts
```

## Requisitos

- Node.js 18+
- PostgreSQL
- npm

## Configuração local

### 1. Clone o repositório

```bash
git clone https://github.com/andrealmeidao/Worklane.git
cd Worklane
```

### 2. Instale as dependências

```bash
npm install
npm --prefix Frontend install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz com algo neste formato:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/taskflow"
JWT_SECRET="sua_chave_jwt_forte"
PORT=3000
VITE_API_URL="http://127.0.0.1:3000"
```

### 4. Aplique as migrations e gere o client do Prisma

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Rode o backend

```bash
npm run dev:backend
```

### 6. Rode o frontend

Em outro terminal:

```bash
npm --prefix Frontend run dev -- --host 127.0.0.1
```

Frontend:

```text
http://127.0.0.1:5173
```

Backend:

```text
http://127.0.0.1:3000
```

## Scripts úteis

### Raiz

```bash
npm run dev:backend
npm run prisma:generate
```

### Frontend

```bash
npm --prefix Frontend run dev
npm --prefix Frontend run build
npm --prefix Frontend run preview
```

## API principal

Rotas mais importantes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`
- `POST /api/columns/board/:boardId`
- `PUT /api/columns/board/:boardId/reorder`
- `POST /api/tasks/column/:columnId`
- `GET /api/comments/task/:taskId`
- `POST /api/comments/task/:taskId`
- `GET /api/members/board/:boardId`

## Estado atual do projeto

Hoje o Worklane já está em um nível sólido para portfólio:

- fluxo principal funcional de ponta a ponta
- backend com Prisma e RBAC básico
- frontend com UX mais refinada
- persistência real de perfil e configurações
- board com comportamento próximo de um Kanban moderno

## Próximos passos recomendados

- testes E2E do fluxo principal
- activity log por board e tarefa
- notificações reais
- upload de avatar
- labels/tags por tarefa
- melhoria adicional do dark mode em todas as telas

## Licença

Este projeto está disponível para fins de estudo, portfólio e evolução pessoal.

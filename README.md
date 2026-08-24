# Worklane

Aplicação fullstack de gestão visual de trabalho, inspirada em ferramentas Kanban. O Worklane permite organizar projetos em boards, acompanhar tarefas por etapas e colaborar com outras pessoas em um único espaço de trabalho.

## Demo

**Acesse a aplicação:** [worklane-one.vercel.app](https://worklane-one.vercel.app/)

## Funcionalidades

- Cadastro, login e autenticação com JWT
- Sessão persistida e proteção de rotas
- Criação, edição e exclusão de boards
- Colunas ordenáveis com persistência
- Tarefas com prioridade, prazo e responsável
- Drag and drop de tarefas e colunas
- Comentários em tarefas
- Membros de board com permissões `OWNER`, `ADMIN` e `MEMBER`
- Perfil com nome, bio, cargo e avatar
- Preferências de tema e notificações
- Dashboard com métricas e últimos boards acessados
- Interface responsiva com dark mode

## Tecnologias

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- dnd-kit
- React Hot Toast

### Backend e dados

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt

## Estrutura do projeto

```text
Worklane/
├── Backend/
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── utils/
├── Frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── prisma.config.ts
└── package.json
```

## Requisitos

- Node.js 18 ou superior
- PostgreSQL
- npm

## Instalação local

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/andrealmeidao/Worklane.git
cd Worklane
npm install
npm --prefix Frontend install
```

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/Worklane"
JWT_SECRET="crie_uma_chave_secreta_forte"
PORT=3000
```

Sincronize o schema e gere o Prisma Client:

```bash
npx prisma db push
npx prisma generate
```

Inicie o backend:

```bash
npm run dev:backend
```

Em outro terminal, inicie o frontend:

```bash
npm --prefix Frontend run dev
```

Aplicação local:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:3000`

O frontend usa `http://127.0.0.1:3000` como padrão. Para apontar para outra API, defina `VITE_API_URL` no ambiente do frontend:

```env
VITE_API_URL="https://seu-backend.example.com"
```

## Scripts

Na raiz:

```bash
npm run dev:backend
npm run prisma:generate
```

No frontend:

```bash
npm --prefix Frontend run dev
npm --prefix Frontend run build
npm --prefix Frontend run preview
npm --prefix Frontend run lint
```

## API principal

| Método | Endpoint | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Cria uma conta |
| `POST` | `/api/auth/login` | Autentica um usuário |
| `GET` | `/api/users/me` | Retorna o usuário autenticado |
| `PUT` | `/api/users/me` | Atualiza o perfil |
| `GET` | `/api/boards` | Lista os boards disponíveis |
| `POST` | `/api/boards` | Cria um board |
| `GET` | `/api/boards/:id` | Consulta um board |
| `PUT` | `/api/boards/:id` | Atualiza um board |
| `DELETE` | `/api/boards/:id` | Exclui um board |
| `POST` | `/api/columns/board/:boardId` | Cria uma coluna |
| `POST` | `/api/tasks/column/:columnId` | Cria uma tarefa |
| `GET` | `/api/comments/task/:taskId` | Lista comentários |
| `POST` | `/api/comments/task/:taskId` | Adiciona um comentário |
| `GET` | `/api/members/board/:boardId` | Lista membros |

As rotas protegidas exigem o header:

```http
Authorization: Bearer <token>
```

## Deploy atual

O projeto é dividido em dois serviços:

- Frontend: [Worklane na Vercel](https://worklane-one.vercel.app/)
- Backend: `https://worklane-api.onrender.com`
- Banco: PostgreSQL hospedado no Render

### Frontend na Vercel

Configure a pasta raiz como `Frontend` e use:

```text
Build Command: npm run build
Output Directory: dist
```

Variável de ambiente:

```env
VITE_API_URL=https://worklane-api.onrender.com
```

### Backend no Render

Use o repositório na branch `main` com:

```text
Build Command: npm install && npx prisma generate && npx prisma db push
Start Command: node Backend/src/server.js
```

Variáveis necessárias:

```env
DATABASE_URL=<Internal Database URL do PostgreSQL no Render>
JWT_SECRET=<chave secreta forte>
```

Nunca versione arquivos `.env` ou publique credenciais no repositório.

## Roadmap

- Testes automatizados do fluxo de autenticação
- Activity log por board e tarefa
- Notificações em tempo real
- Upload de avatar
- Labels e tags para tarefas
- Refinamento do dark mode

## Licença

Este projeto está sob a licença [MIT](LICENSE).

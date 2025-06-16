# 🏋️‍♂️ Sistema de Gestão de Academia

Sistema completo para gerenciamento de academias, desenvolvido como trabalho prático para a disciplina de Banco de Dados com MongoDB.


### 🎯 Funcionalidades Principais

- ✅ CRUD completo para todas as entidades (Alunos, Professores, Treinos, Planos)
- ✅ Sistema de autenticação e autorização
- ✅ Consultas avançadas com operadores MongoDB ($gt, $lt, $or, $and, $in, $gte)
- ✅ Validação robusta com express-validator
- ✅ Interface web responsiva e moderna
- ✅ API RESTful documentada


## 🌐 Status de Hospedagem

> 🚧 **Em desenvolvimento**: A API será hospedada em breve na Vercel
> 
> 📱 **Frontend**: Pode ser executado localmente abrindo o arquivo `public/home.html`

## 🚀 Como rodar localmente

### 1. Clone o repositório:
```bash
git clone https://github.com/Adejarbas/academia-mongoDB.git
cd academia-mongoDB-main
```

### 2. Instale as dependências:
```bash
npm install
```

### 3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
MONGODB_URI=sua_string_de_conexao_mongodb
JWT_SECRET=sua_chave_secreta_jwt
PORT=3000
```

### 4. Inicie o servidor:
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

### 5. Acesse a aplicação:
- **API**: `http://localhost:3000`
- **Frontend**: Abra o arquivo `public/home.html` no navegador

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **express-validator** - Validação de dados
- **jsonwebtoken** - Autenticação JWT
- **bcryptjs** - Criptografia de senhas

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização responsiva
- **JavaScript** - Interatividade
- **Font Awesome** - Ícones

## � Estrutura do Banco de Dados

### Collection: Alunos
- `nome` (String) - Nome completo
- `email` (String) - Email único
- `dataNascimento` (Date) - Data de nascimento ⭐
- `telefone` (String) - Telefone de contato
- `idade` (Number) - Idade em anos ⭐ (Inteiro)
- `peso` (Number) - Peso em kg ⭐ (Decimal)
- `endereco` (String) - Endereço residencial
- `plano` (ObjectId) - Referência ao plano
- `treinos` (Array) - Lista de treinos

### Collection: Professores
- `nome` (String) - Nome completo
- `email` (String) - Email único
- `especialidade` (String) - Área de especialização
- `telefone` (String) - Telefone de contato
- `dataContratacao` (Date) - Data de contratação ⭐
- `salario` (Number) - Salário mensal ⭐ (Decimal)
- `ativo` (Boolean) - Status ativo/inativo

### Collection: Treinos
- `nome` (String) - Nome do treino
- `descricao` (String) - Descrição detalhada
- `exercicios` (Array) - Lista de exercícios
- `duracao` (Number) - Duração em minutos ⭐ (Inteiro)
- `dificuldade` (Number) - Nível de 1-10 ⭐ (Inteiro)
- `dataCriacao` (Date) - Data de criação ⭐
- `professor` (ObjectId) - Referência ao professor

### Collection: Planos
- `nome` (String) - Nome do plano
- `descricao` (String) - Descrição do plano
- `preco` (Number) - Preço mensal ⭐ (Decimal)
- `duracaoMeses` (Number) - Duração em meses ⭐ (Inteiro)
- `dataInicio` (Date) - Data de início ⭐
- `ativo` (Boolean) - Status ativo/inativo
- `beneficios` (Array) - Lista de benefícios

⭐ *Campos obrigatórios do projeto: Data, Inteiro, Decimal*

## 📚 Endpoints da API

### 🔐 Autenticação
- `POST /auth/register` - Cadastrar usuário
- `POST /auth/login` - Fazer login
- `GET /auth/me` - Dados do usuário logado

### 👥 Alunos
- `GET /alunos` - Lista todos os alunos
- `GET /alunos/:id` - Busca aluno por ID
- `POST /alunos` - Cria um novo aluno
- `PUT /alunos/:id` - Atualiza um aluno
- `DELETE /alunos/:id` - Remove um aluno
- `GET /alunos/consulta/avancada` - Consulta com operadores básicos
- `GET /alunos/consulta/complexa` - Consulta com múltiplos operadores

### 👨‍🏫 Professores
- `GET /professores` - Lista todos os professores
- `GET /professores/:id` - Busca professor por ID
- `POST /professores` - Cria um novo professor
- `PUT /professores/:id` - Atualiza um professor
- `DELETE /professores/:id` - Remove um professor

### 🏋️‍♂️ Treinos
- `GET /treinos` - Lista todos os treinos
- `GET /treinos/:id` - Busca treino por ID
- `POST /treinos` - Cria um novo treino
- `PUT /treinos/:id` - Atualiza um treino
- `DELETE /treinos/:id` - Remove um treino

### 💳 Planos
- `GET /planos` - Lista todos os planos
- `GET /planos/:id` - Busca plano por ID
- `POST /planos` - Cria um novo plano
- `PUT /planos/:id` - Atualiza um plano
- `DELETE /planos/:id` - Remove um plano

## 🔍 Consultas Avançadas Implementadas

### Consulta Básica com Operadores
```http
GET /alunos/consulta/avancada?idade=20&peso=70
```
- **Operadores usados**: `$gt` (maior que), `$and` (implícito)
- **Descrição**: Busca alunos com idade > 20 E peso > 70

### Consulta Complexa com Múltiplos Operadores
```http
GET /alunos/consulta/complexa?pesoMin=60&pesoMax=90&idades=18,25,30&nomes=João,Maria
```
- **Operadores usados**: `$or`, `$and`, `$gte`, `$lt`, `$in`
- **Descrição**: Busca alunos que atendam a pelo menos uma das condições:
  - Peso entre 60kg e 90kg
  - Idade seja 18, 25 ou 30 anos
  - Nome contenha "João" ou "Maria"

## 📋 Validações Implementadas

- ✅ **Campos obrigatórios**: Validação de presença
- ✅ **Formato de email**: Validação de formato válido
- ✅ **Tipos de dados**: Inteiros, decimais, datas
- ✅ **Unicidade**: Emails únicos por collection
- ✅ **Ranges**: Valores mínimos e máximos
- ✅ **Expressões regulares**: Telefones, nomes

## 🧪 Testando a API

### 📖 Documentação Swagger (Recomendado)
**Interface interativa completa com todos os endpoints:**
```
http://localhost:3000/api-docs
```

**Funcionalidades da documentação:**
- ✅ **Interface visual** moderna e responsiva
- ✅ **Teste integrado** (Try it out) para cada endpoint
- ✅ **Autenticação JWT** pré-configurada
- ✅ **Exemplos práticos** de request/response
- ✅ **Esquemas de dados** detalhados
- ✅ **Códigos de status** e mensagens de erro
- ✅ **Filtros por categoria** (Alunos, Professores, etc.)

### Usando REST Client (VS Code)
1. Instale a extensão "REST Client"
2. Abra o arquivo `api/http/api.http`
3. Execute as requisições diretamente no VS Code

### Usando Postman/Insomnia
- Importe a collection ou use os endpoints documentados
- Configure a autenticação Bearer Token após login

## 🛠️ Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Gerar/atualizar documentação Swagger
npm run swagger

# Executar testes unitários
npm test

# Executar testes com cobertura
npm run test:coverage
```

## 📝 Observações Técnicas

- **Autenticação**: JWT Token obrigatório para todas as rotas (exceto login/register)
- **Autorização**: Usuários só podem acessar seus próprios dados
- **Validação**: Todos os dados são validados com express-validator
- **Segurança**: Senhas criptografadas com bcrypt
- **Modularização**: Código organizado em controllers, models, routes e middlewares

## 🎓 Trabalho Acadêmico

Este projeto foi desenvolvido como trabalho prático para a disciplina de **Banco de Dados - MongoDB** e atende a todos os requisitos solicitados:

- ✅ Collection com 5+ atributos incluindo data, inteiro e decimal
- ✅ CRUD completo (GET, POST, PUT, DELETE)
- ✅ Frontend em HTML/CSS/JS puro
- ✅ Validação com express-validator
- ✅ Consultas com operadores de comparação e lógicos
- ✅ Documentação REST Client
- ✅ Projeto versionado no GitHub

---

**Desenvolvido com ❤️ por Daniel Adejarbas e Taise Miguel**

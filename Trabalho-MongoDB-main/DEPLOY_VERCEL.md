# Deploy Vercel - Academia MongoDB

## Configurações Importantes

### 1. Variáveis de Ambiente no Vercel
Configure as seguintes variáveis no dashboard do Vercel:

```
MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/academia?retryWrites=true&w=majority
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
NODE_ENV=production
```

### 2. Estrutura de Arquivos
```
projeto/
├── api/
│   ├── index.js (Handler principal do Vercel)
│   └── ... (outros arquivos da API)
├── public/
│   ├── index.html (Página principal)
│   ├── login.html
│   ├── home.html
│   ├── main.js
│   └── style.css
└── vercel.json (Configuração de rotas)
```

### 3. Como as Rotas Funcionam
- `/api/*` → Direcionado para `api/index.js` (Backend)
- `/*` → Direcionado para `public/index.html` (Frontend)
- Arquivos estáticos servidos diretamente de `public/`

### 4. URLs Importantes
- Homepage: `https://seu-app.vercel.app/`
- Login: `https://seu-app.vercel.app/login.html`
- Dashboard: `https://seu-app.vercel.app/` (após login)
- API Docs: `https://seu-app.vercel.app/api-docs`

### 5. Credenciais de Teste
- Email: `admin@academia.com`
- Senha: `admin123`

### 6. Troubleshooting

#### Erro "Unexpected token '<', "<!DOCTYPE"..."
- **Causa**: Conflito entre rotas de API e frontend
- **Solução**: Verificar se `vercel.json` está configurado corretamente

#### API retorna 404
- **Causa**: Rotas de API não estão sendo direcionadas corretamente
- **Solução**: Verificar se todas as rotas começam com `/api/`
- **Teste**: Acesse `https://seu-app.vercel.app/api/test` para verificar se a API está funcionando

#### Páginas não carregam
- **Causa**: Arquivos estáticos não estão sendo servidos
- **Solução**: Verificar se os arquivos estão na pasta `public/`

#### Debug de API
1. Teste a rota de health check: `https://seu-app.vercel.app/api/health`
2. Teste a rota de teste: `https://seu-app.vercel.app/api/test`
3. Verifique os logs no dashboard do Vercel
4. Confirme se as variáveis de ambiente estão configuradas

#### Variáveis de Ambiente Obrigatórias
- `MONGO_URI`: String de conexão do MongoDB
- `JWT_SECRET`: Chave secreta para JWT
- `NODE_ENV`: Deve ser "production"

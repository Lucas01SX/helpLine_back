# Use uma imagem base do Node.js
FROM node:12.8.1-alpine

# Defina o diretório de trabalho no contêiner
WORKDIR /app

# Copie os arquivos de configuração do projeto
COPY package*.json tsconfig.json ./

# Instale as dependências do projeto
RUN npm install --omit=optional

# Copie o restante dos arquivos do projeto
COPY . .

# Compile o TypeScript para JavaScript
RUN npm run build

# Exponha a porta que o aplicativo usará
EXPOSE 3000

# Comando para iniciar o servidor no modo de desenvolvimento
CMD ["npm", "run", "dev"]

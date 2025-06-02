# Imagem base oficial do Node.js
FROM node:20

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todo o restante do projeto
COPY . .

# Expõe a porta usada pelo servidor Express
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "index.js"]

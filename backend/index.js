// Importações
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const initSqlJs = require('sql.js');

// Inicializa a aplicação Express
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db; // Será inicializado após carregar sql.js

initSqlJs().then((SQL) => {
  // Cria o banco de dados em memória
  db = new SQL.Database();

  // Criação da tabela
  db.run(`
    CREATE TABLE IF NOT EXISTS Alunos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      curso TEXT
    );
  `);

  console.log("Banco SQLite em memória inicializado.");

  // Rota GET: lista todos os alunos
  app.get('/alunos', (req, res) => {
    try {
      const result = db.exec("SELECT * FROM Alunos ORDER BY nome");
      const rows = result[0] ? result[0].values.map((row) => {
        const [id, nome, email, curso] = row;
        return { id, nome, email, curso };
      }) : [];
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar alunos: " + err.message });
    }
  });

  // Rota POST: adiciona um novo aluno
  app.post('/alunos', (req, res) => {
    const { nome, email, curso } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }
    try {
      db.run("INSERT INTO Alunos (nome, email, curso) VALUES (?, ?, ?)", [nome, email, curso]);
      const result = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
      res.status(201).json({ id: result, nome, email, curso });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Este email já está cadastrado.' });
      }
      res.status(500).json({ error: "Erro ao cadastrar aluno: " + err.message });
    }
  });

  // Rota DELETE: remove um aluno
  app.delete('/alunos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const before = db.exec("SELECT COUNT(*) FROM Alunos WHERE id = ?;", [id])[0].values[0][0];
      db.run("DELETE FROM Alunos WHERE id = ?", [id]);
      if (before === 0) {
        return res.status(404).json({ error: 'Aluno não encontrado.' });
      }
      res.json({ message: 'Aluno removido com sucesso!' });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar aluno: " + err.message });
    }
  });

  // Rota PUT: atualiza um aluno
  app.put('/alunos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, email, curso } = req.body;

    if (!nome && !email && !curso) {
      return res.status(400).json({ error: 'Forneça ao menos um campo para atualizar.' });
    }

    let fields = [];
    let values = [];

    if (nome) { fields.push("nome = ?"); values.push(nome); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (curso) { fields.push("curso = ?"); values.push(curso); }
    values.push(id);

    try {
      const before = db.exec("SELECT COUNT(*) FROM Alunos WHERE id = ?", [id])[0].values[0][0];
      db.run(`UPDATE Alunos SET ${fields.join(', ')} WHERE id = ?`, values);
      if (before === 0) {
        return res.status(404).json({ error: 'Aluno não encontrado para atualização.' });
      }
      res.json({ message: 'Aluno atualizado com sucesso!' });
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Este email já está cadastrado.' });
      }
      res.status(500).json({ error: "Erro ao atualizar aluno: " + err.message });
    }
  });

  // Inicia o servidor
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
});

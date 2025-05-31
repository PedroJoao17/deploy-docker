// Importação dos módulos necessários
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

require('dotenv').config();

// Inicializa a aplicação Express
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,        // <-- Substitua aqui
  password: process.env.DB_PASSWORD,      // <-- Substitua aqui
  database: process.env.DB_DATABASE   // <-- Substitua aqui
});

// Conectar ao banco
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados MySQL:', err.message);
  } else {
    console.log('Conectado ao banco de dados MySQL.');

    // Cria a tabela Alunos, se não existir
    const sql = `
      CREATE TABLE IF NOT EXISTS Alunos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        curso VARCHAR(255)
      )
    `;
    db.query(sql, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
      } else {
        console.log("Tabela 'Alunos' verificada/criada com sucesso.");
      }
    });
  }
});


// --- ROTAS DA API ---

// GET - Listar todos os alunos
app.get('/alunos', (req, res) => {
  db.query('SELECT * FROM Alunos ORDER BY nome', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar alunos: ' + err.message });
    }
    res.json(results);
  });
});

// POST - Cadastrar novo aluno
app.post('/alunos', (req, res) => {
  const { nome, email, curso } = req.body;
  if (!nome) return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
  if (!email) return res.status(400).json({ error: 'O campo "email" é obrigatório.' });

  const sql = 'INSERT INTO Alunos (nome, email, curso) VALUES (?, ?, ?)';
  db.query(sql, [nome, email, curso], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este email já está cadastrado.' });
      }
      return res.status(500).json({ error: 'Erro ao cadastrar aluno: ' + err.message });
    }
    res.status(201).json({ id: result.insertId, nome, email, curso });
  });
});

// DELETE - Remover aluno por ID
app.delete('/alunos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Alunos WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar aluno: ' + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    res.json({ message: 'Aluno removido com sucesso!' });
  });
});

// PUT - Atualizar aluno por ID
app.put('/alunos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, curso } = req.body;

  if (!nome && !email && !curso) {
    return res.status(400).json({ error: 'Forneça ao menos um campo para atualizar (nome, email, curso).' });
  }

  let fields = [];
  let values = [];

  if (nome) { fields.push('nome = ?'); values.push(nome); }
  if (email) { fields.push('email = ?'); values.push(email); }
  if (curso) { fields.push('curso = ?'); values.push(curso); }

  values.push(id);

  const sql = `UPDATE Alunos SET ${fields.join(', ')} WHERE id = ?`;
  db.query(sql, values, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este email já está cadastrado para outro aluno.' });
      }
      return res.status(500).json({ error: 'Erro ao atualizar aluno: ' + err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado para atualização.' });
    }
    res.json({ message: 'Aluno atualizado com sucesso!', changes: result.affectedRows });
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});

// ARQUIVO DE TESTE DO AGENTE DE AUDITORIA — contém vulnerabilidades propositais.
// Não é importado por nenhum código de produção. Remover após o teste.

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const db = require('../backend/src/db');

const app = express();

// 1) Segredo hardcoded
const ADMIN_API_KEY = 'sk-live-9f8e7d6c5b4a3210fedcba';

// 2) SQL injection por concatenação de string
app.get('/users', async (req, res) => {
  const rows = await db.query(`SELECT * FROM users WHERE name = '${req.query.name}'`);
  res.json(rows);
});

// 3) Command injection
app.get('/ping', (req, res) => {
  exec(`ping -c 1 ${req.query.host}`, (err, stdout) => res.send(stdout));
});

// 4) Path traversal
app.get('/files', (req, res) => {
  res.send(fs.readFileSync(`./uploads/${req.query.file}`, 'utf8'));
});

// 5) Autenticação ausente em rota administrativa
app.delete('/admin/users/:id', async (req, res) => {
  await db.query(`DELETE FROM users WHERE id = ${req.params.id}`);
  res.sendStatus(204);
});

module.exports = { app, ADMIN_API_KEY };

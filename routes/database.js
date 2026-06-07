const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

let connections = {
  sqlite: null,
  mysql: null,
  pg: null
};

// Conexión a SQLite
router.post('/connect/sqlite', (req, res) => {
  const { dbFile } = req.body;
  try {
    if (connections.sqlite) connections.sqlite.close();
    connections.sqlite = new sqlite3.Database(dbFile || './data/database.db');
    res.json({ success: true, message: 'Conectado a SQLite' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conexión a MySQL
router.post('/connect/mysql', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  try {
    if (connections.mysql) await connections.mysql.end();
    connections.mysql = await mysql.createConnection({
      host, port: port || 3306, user, password, database
    });
    res.json({ success: true, message: 'Conectado a MySQL' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conexión a PostgreSQL
router.post('/connect/postgres', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  try {
    if (connections.pg) await connections.pg.end();
    connections.pg = new Pool({ host, port: port || 5432, user, password, database });
    await connections.pg.connect();
    res.json({ success: true, message: 'Conectado a PostgreSQL' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ejecutar consulta
router.post('/query', async (req, res) => {
  const { dbType, sql } = req.body;
  try {
    let result;
    switch (dbType) {
      case 'sqlite':
        result = await new Promise((resolve, reject) => {
          connections.sqlite.all(sql, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        break;
      case 'mysql':
        [result] = await connections.mysql.execute(sql);
        break;
      case 'postgres':
        result = (await connections.pg.query(sql)).rows;
        break;
      default:
        throw new Error('Base de datos no conectada');
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desconectar
router.post('/disconnect', (req, res) => {
  const { dbType } = req.body;
  if (connections[dbType]) {
    connections[dbType].close();
    connections[dbType] = null;
  }
  res.json({ success: true });
});

module.exports = router;

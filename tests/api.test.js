const request = require('supertest');
const express = require('express');
const session = require('express-session');
const dbRoutes = require('../routes/database');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: true
}));
app.use('/api', dbRoutes);

describe('Server-SQL API Tests', () => {
  
  describe('Conexiones a bases de datos', () => {
    
    test('POST /api/connect/sqlite - conexión exitosa', async () => {
      const response = await request(app)
        .post('/api/connect/sqlite')
        .send({ dbFile: ':memory:' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Conectado');
    });

    test('POST /api/connect/sqlite - error con archivo inválido', async () => {
      const response = await request(app)
        .post('/api/connect/sqlite')
        .send({ dbFile: '/ruta/invalida/que/no/existe.db' });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    test('POST /api/connect/mysql - error sin conexión', async () => {
      const response = await request(app)
        .post('/api/connect/mysql')
        .send({
          host: 'localhost',
          port: 3307,
          user: 'usuario_invalido',
          password: 'wrong',
          database: 'test'
        });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Ejecución de consultas', () => {
    
    beforeAll(async () => {
      // Conectar a SQLite en memoria
      await request(app)
        .post('/api/connect/sqlite')
        .send({ dbFile: ':memory:' });
      
      // Crear tabla de prueba
      await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)'
        });
    });

    test('POST /api/query - INSERT exitoso', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: "INSERT INTO test (name) VALUES ('Prueba')"
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/query - SELECT exitoso', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'SELECT * FROM test'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Prueba');
    });

    test('POST /api/query - SQL inválido', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'SELECT * FROM tabla_que_no_existe'
        });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    test('POST /api/query - sin conexión activa', async () => {
      // Desconectar primero
      await request(app)
        .post('/api/disconnect')
        .send({ dbType: 'sqlite' });
      
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'SELECT 1'
        });
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Desconexión', () => {
    
    test('POST /api/disconnect - desconexión exitosa', async () => {
      // Conectar primero
      await request(app)
        .post('/api/connect/sqlite')
        .send({ dbFile: ':memory:' });
      
      const response = await request(app)
        .post('/api/disconnect')
        .send({ dbType: 'sqlite' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('POST /api/disconnect - desconectar BD no conectada', async () => {
      const response = await request(app)
        .post('/api/disconnect')
        .send({ dbType: 'mysql' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Consultas avanzadas', () => {
    
    beforeAll(async () => {
      await request(app)
        .post('/api/connect/sqlite')
        .send({ dbFile: ':memory:' });
      
      await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: `
            CREATE TABLE users (
              id INTEGER PRIMARY KEY,
              name TEXT,
              email TEXT,
              age INTEGER
            )
          `
        });
      
      // Insertar datos de prueba
      const users = [
        ['Juan', 'juan@test.com', 25],
        ['Maria', 'maria@test.com', 30],
        ['Carlos', 'carlos@test.com', 35]
      ];
      
      for (const user of users) {
        await request(app)
          .post('/api/query')
          .send({
            dbType: 'sqlite',
            sql: `INSERT INTO users (name, email, age) VALUES ('${user[0]}', '${user[1]}', ${user[2]})`
          });
      }
    });

    test('Consulta con WHERE', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: "SELECT * FROM users WHERE age > 28"
        });
      
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].name).toBe('Maria');
    });

    test('Consulta con JOIN', async () => {
      await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'CREATE TABLE orders (id INTEGER, user_id INTEGER, product TEXT)'
        });
      
      await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: "INSERT INTO orders VALUES (1, 1, 'Laptop'), (2, 1, 'Mouse'), (3, 2, 'Keyboard')"
        });
      
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: `
            SELECT users.name, orders.product 
            FROM users 
            JOIN orders ON users.id = orders.user_id
          `
        });
      
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0].name).toBe('Juan');
    });

    test('Consulta de agregación', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({
          dbType: 'sqlite',
          sql: 'SELECT AVG(age) as avg_age, COUNT(*) as total FROM users'
        });
      
      expect(response.body.data[0].avg_age).toBe(30);
      expect(response.body.data[0].total).toBe(3);
    });
  });
});

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'server-sql-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Autenticación básica
const authMiddleware = (req, res, next) => {
  if (!process.env.AUTH_ENABLED || process.env.AUTH_ENABLED === 'false') {
    return next();
  }
  if (req.session.authenticated) {
    return next();
  }
  res.status(401).send('Acceso no autorizado. Inicia sesión en /login');
};

// Importar rutas de bases de datos
const dbRoutes = require('./routes/database');

app.use('/api', authMiddleware, dbRoutes);

// Ruta de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.send('Credenciales incorrectas');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Servir interfaz principal
app.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Crear directorio data si no existe
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

app.listen(PORT, () => {
  console.log(`Server-SQL corriendo en http://localhost:${PORT}`);
});

# Server-SQL

**Server-SQL** es una herramienta web self-hosted que permite ejecutar consultas SQL a través de un navegador. Ideal para entornos de desarrollo, administración rápida de bases de datos o como interfaz liviana para tus proyectos.

## 🚀 Características
- Editor SQL con resaltado de sintaxis
- Soporte para SQLite, MySQL y PostgreSQL
- Historial de consultas ejecutadas
- Exportación de resultados a JSON/CSV
- Autenticación básica opcional
- API REST para ejecutar consultas programáticamente

## 🛠️ Tecnologías
- Backend: Node.js + Express
- Frontend: HTML5, TailwindCSS, Monaco Editor
- DB Drivers: `sqlite3`, `mysql2`, `pg`

## 📦 Instalación rápida
```bash
git clone https://github.com/Falconmx1/Server-SQL.git
cd Server-SQL
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm start

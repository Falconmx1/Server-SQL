// Configurar entorno de pruebas
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.AUTH_ENABLED = 'false';

const fs = require('fs');
const path = require('path');

// Crear directorio temporal para pruebas
const testDataDir = path.join(__dirname, '../test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir);
}

// Limpiar archivos temporales después de pruebas
afterAll(() => {
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
});

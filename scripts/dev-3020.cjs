// Lokaler Start auf Port 3020 (3000 und 3010/3011 sind auf dem Entwicklungsrechner belegt).
const path = require('path');

process.chdir(path.join(__dirname, '..'));
process.env.PORT = '3020';

require('../src/server.js');

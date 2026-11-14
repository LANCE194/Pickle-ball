// Role loader: discovers every features/*/index.js manifest automatically (no central file to edit).
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'features');
const features = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => require(path.join(dir, d.name))).sort((a, b) => (a.order || 0) - (b.order || 0));
module.exports = { roles: ["coach_referee"], features };

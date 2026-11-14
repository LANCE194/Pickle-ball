const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'features');
const features = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => require(path.join(dir, d.name)));
module.exports = { roles: ['admin', 'staff', 'coach_referee', 'player', 'super_admin'], features };

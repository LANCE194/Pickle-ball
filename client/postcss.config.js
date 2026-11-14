import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
// Explicit config path so the build works when started from the project root (one server, one command).
export default { plugins: { tailwindcss: { config: path.join(here, 'tailwind.config.js') }, autoprefixer: {} } };

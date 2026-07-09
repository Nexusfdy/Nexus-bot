const fs = require('fs');

const modules = [
  "admin", "commands", "config", "core", "deliveries", "misc", 
  "modLogs", "orders", "products", "stats", "system", "transactions", "users"
];

let imports = '';
let exportKeys = [];

for (const mod of modules) {
  if (mod === 'core') continue; // core has pgPool, etc
  const content = fs.readFileSync(`src/db/modules/${mod}.ts`, 'utf8');
  const exportedMatch = Array.from(content.matchAll(/export const ([a-zA-Z0-9_]+) =/g)).map(m => m[1]);
  if (exportedMatch.length > 0) {
    imports += `import {\n  ${exportedMatch.join(',\n  ')}\n} from './modules/${mod}.js';\n`;
    exportKeys.push(...exportedMatch);
  }
}

imports += `\nimport { dbType, bootstrapTables } from './core.js';\n`;
imports += `\nexport { bootstrapTables };\n`;
imports += `\nexport const dbService = {\n  getEngine: () => dbType,\n  ${exportKeys.join(',\n  ')}\n};\n`;

fs.writeFileSync('src/db/db_service.ts', imports);

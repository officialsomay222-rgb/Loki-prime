const fs = require('fs');
const types = fs.readFileSync('node_modules/@google/genai/dist/index.d.ts', 'utf8');
if (types.includes('thought:')) {
  console.log("has thought");
} else {
  console.log("no thought in types");
}

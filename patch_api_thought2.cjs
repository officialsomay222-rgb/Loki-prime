const fs = require('fs');
let file = fs.readFileSync('api/index.ts', 'utf8');

const regex1 = /          if \\(chunk\\.text\\) {\\n            res\\.write\\(\`data: \\$\\{JSON\\.stringify\\(\\{ text: chunk\\.text \\}\\)\\}\\n\\n\`\\);\\n          }/g;

const replacement = `          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.thought && part.text) {
                res.write(\`data: \${JSON.stringify({ thought: part.text })}\\n\\n\`);
              } else if (part.text && !part.thought) {
                res.write(\`data: \${JSON.stringify({ text: part.text })}\\n\\n\`);
              }
            }
          }`;

file = file.replace(regex1, replacement);

fs.writeFileSync('api/index.ts', file);

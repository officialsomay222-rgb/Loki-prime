const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(/rowVirtualizer\.getTotalSize\(\), \/\/ Crucial/, `rowVirtualizer.getTotalSize(), // Crucial\n    inputHeight,`);

fs.writeFileSync('src/App.tsx', file);

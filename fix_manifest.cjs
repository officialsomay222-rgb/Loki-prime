const fs = require('fs');
let file = fs.readFileSync('public/manifest.webmanifest', 'utf8');

file = file.replace(/"display": "standalone"/, '"display": "minimal-ui"');

fs.writeFileSync('public/manifest.webmanifest', file);

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/manifest\.webmanifest\?v=2/, 'manifest.webmanifest?v=3');
fs.writeFileSync('index.html', indexHtml);

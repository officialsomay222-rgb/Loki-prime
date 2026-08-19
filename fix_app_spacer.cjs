const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Remove inner spacer
file = file.replace(/{\/\* Inner spacer for header \*\/}\n\s*<div className="w-full shrink-0" style={{ height: "calc\\(4.25rem \+ env\\(safe-area-inset-top, 0px\\)\\)" }} \/>\n/, '');

// Fix empty state height calculation (it doesn't need to subtract the header height since the spacer is gone)
file = file.replace(/height: "calc\\(100% - 4\.5rem - env\\(safe-area-inset-top, 0px\\)\\)",/, 'height: "100%",');

// Update useVirtualizer paddingEnd to ensure it gives enough space above the keyboard
file = file.replace(/paddingEnd: inputHeight \+ 80,/, 'paddingEnd: inputHeight + 80,'); // this is fine

fs.writeFileSync('src/App.tsx', file);

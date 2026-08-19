const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the inner spacer
file = file.replace(/{\/\* Inner spacer for header \*\/}\n\s*<div className="w-full shrink-0" style={{ height: "calc\\(4.25rem \+ env\\(safe-area-inset-top, 0px\\)\\)" }} \/>\n/, '');

// Apply padding-top directly to scrollContainerRef
file = file.replace(/style={{\n\s*WebkitOverflowScrolling: "touch",/, `style={{\n              paddingTop: "calc(4.25rem + env(safe-area-inset-top, 0px))",\n              WebkitOverflowScrolling: "touch",`);

// Change the empty state height adjustment to account for the padding-top being on the parent
file = file.replace(/height: "calc\\(100% - 4\.5rem - env\\(safe-area-inset-top, 0px\\)\\)",/, `height: "100%",`);

// Also to give the extra space at the end of the response:
// Add extra margin/padding to messagesEndRef
file = file.replace(/<div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: inputHeight \+ 20 }} \/>/, `<div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: inputHeight + 80 }} />`);

fs.writeFileSync('src/App.tsx', file);

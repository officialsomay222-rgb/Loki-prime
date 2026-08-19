const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the messagesEndRef div to have 0 height since paddingEnd on useVirtualizer handles the space!
// But we keep it so the IntersectionObserver for "scroll to bottom" button works.
file = file.replace(/<div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: inputHeight \+ 80 }} \/>/, '<div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: 1 }} />');

fs.writeFileSync('src/App.tsx', file);

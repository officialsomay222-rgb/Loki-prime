const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

// We need to measure the ChatInput container height.
// Let's add a ResizeObserver to the absolute div holding ChatInput.

file = file.replace(/const inputRef = useRef<ChatInputHandle>\(null\);/, `const inputRef = useRef<ChatInputHandle>(null);\n  const [inputHeight, setInputHeight] = useState(120);\n  const inputWrapperRef = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!inputWrapperRef.current) return;\n    const observer = new ResizeObserver((entries) => {\n      for (let entry of entries) {\n        setInputHeight(entry.contentRect.height);\n      }\n    });\n    observer.observe(inputWrapperRef.current);\n    return () => observer.disconnect();\n  }, []);`);

file = file.replace(/className={\`absolute bottom-0 left-0 right-0 z-20/, `ref={inputWrapperRef}\n            className={\`absolute bottom-0 left-0 right-0 z-20`);

file = file.replace(/<div ref={messagesEndRef} className="h-80 sm:h-96 shrink-0 pointer-events-none" \/>/, `<div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: inputHeight + 20 }} />`);

fs.writeFileSync('src/App.tsx', file);

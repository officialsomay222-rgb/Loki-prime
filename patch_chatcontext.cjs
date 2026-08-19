const fs = require('fs');
let file = fs.readFileSync('src/contexts/ChatContext.tsx', 'utf8');

const replacement = `
        let isNativeThinking = false;
        for await (const chunk of responseStream) {
          if (chunk.thought) {
            if (!isNativeThinking) {
              fullResponse += "\\n<think>\\n";
              isNativeThinking = true;
            }
            fullResponse += chunk.thought;
          }
          if (chunk.text) {
            if (isNativeThinking) {
              fullResponse += "\\n</think>\\n";
              isNativeThinking = false;
            }
            fullResponse += chunk.text;
          }
          
          const now = Date.now();
          if (now - lastUpdateTime > 50) {
            const parsed = extractModelReasoning(fullResponse);
            updateState(parsed);
            lastUpdateTime = now;
            pendingUpdate = false;
          } else {
            pendingUpdate = true;
          }
        }`;

file = file.replace(/        for await \\(const chunk of responseStream\\) {[\\s\\S]*?        }/, replacement);

fs.writeFileSync('src/contexts/ChatContext.tsx', file);

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { useChat } from '../contexts/ChatContext';
import ShockwaveOnly from './ShockwaveOnly';
import { Send } from 'lucide-react';

export const AssistantOverlay = ({ onClose }: { onClose: () => void }) => {
  const { sessions, currentSessionId, sendMessage, stopGeneration } = useChat();
  const [expanded, setExpanded] = useState(false);
  const [inputText, setInputText] = useState("");
  
  const currentSession = sessions.find(s => s.id === currentSessionId);
  
  // We can check if last message is pending
  const recentMessages = currentSession?.messages || [];
  const latestMessage = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;
  const isStreaming = latestMessage?.role === 'user' && !latestMessage.content; // rough check for streaming/loading
  const isAssistantMessage = latestMessage?.role === 'model';
  
  const handleDragEnd = async (event: any, info: any) => {
    if (info.offset.y < -50) {
      setExpanded(true);
      onClose(); 
    } else if (info.offset.y > 50) {
      closeOverlay();
    }
  };

  const closeOverlay = async () => {
    onClose();
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim(), false, undefined, []);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto bg-transparent">
      {/* Invisible backdrop to dismiss */}
      <div
        className="absolute inset-0 bg-transparent"
        onClick={closeOverlay}
      />
      
      {/* Full-screen Shockwave Effect behind the UI */}
      <div className="absolute inset-0 pointer-events-none">
        <ShockwaveOnly config={{
          waveSpeed: 1.5,
          waveThickness: 1.2,
          waveGlow: 1.5,
          particleSpeed: 1.0
        }} />
      </div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full pointer-events-auto flex flex-col gap-4 relative z-10 p-4 sm:p-6"
        style={{ 
           paddingBottom: 'max(env(safe-area-inset-bottom) + 2rem, 3rem)' // Uplifted slightly to not overlay navigation buttons
        }}
      >
        {/* Response Area */}
        <AnimatePresence mode="popLayout">
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-6 py-4 text-[#e3e3e3] font-medium flex items-center justify-center gap-3 w-full "
            >
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Thinking...
            </motion.div>
          )}
          {!isStreaming && isAssistantMessage && latestMessage && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-h-[40vh] overflow-y-auto w-full px-2 custom-scrollbar bg-[#2b2d31]/80 backdrop-blur-xl rounded-3xl p-4 mx-auto max-w-2xl mb-4  border border-white/5"
            >
               <MessageBubble
                  message={latestMessage}
                  commanderName="Owner"
                  avatarUrl=""
                  onEdit={() => {}}
                  onDelete={() => {}}
                  formatDate={(d) => d.toISOString()}
                  bubbleStyle="glass"
                  fontSize="medium"
                  messageAnimation={true}
                  textReveal="fade"
                  animationSpeed="normal"
                  accentColor="cyan"
                  messageDensity="comfortable"
                  showAvatars={false}
               />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area (Pill Search Bar) */}
        <div className="w-full flex justify-center">
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '600px',
                height: '72px',
                backgroundColor: '#2b2d31', // Added transparency 
                borderRadius: '50px',
                padding: '0 16px 0 32px',
                
                boxSizing: 'border-box'
              }}
            >
                <input 
                  type="text" 
                  placeholder="Ask anything..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e3e3e3',
                    fontSize: '22px',
                    fontFamily: 'sans-serif',
                    fontWeight: 400
                  }}
                  autoFocus
                />
                <button 
                  onClick={handleSend}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

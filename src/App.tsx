import React, {
  useState,
  useRef,
  useEffect,
  memo,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { NetworkStatusIndicator } from "./components/NetworkStatusIndicator";

import { ChatInput, ChatInputHandle } from "./components/ChatInput";
import { useAwakening } from "./hooks/useAwakening";
import { AvatarShockwave } from "./components/AvatarShockwave";
import WebGLShockwave from "./components/WebGLShockwave";
import { MessageBubble } from "./components/MessageBubble";
import { AwakenedBackground } from "./components/AwakenedBackground";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsModal } from "./components/SettingsModal";
import { useDeepCompareMemo } from "./hooks/useDeepCompareMemo";
import { AppsModal } from "./components/AppsModal";
import { WelcomeModal } from "./components/WelcomeModal";
import { useSettings } from "./contexts/SettingsContext";
import { useAuth } from "./contexts/AuthContext";
import { useChat } from "./contexts/ChatContext";
import { InfinityLogo, HeaderInfinityLogo } from "./components/Logos";
import { TimelineItem } from "./components/TimelineItem";
import { format, isToday } from "date-fns";
import { TaskWidget } from "./features/tasks/components/TaskWidget";
import { AssistantOverlay } from "./components/AssistantOverlay";
import {
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  Sun,
  Moon,
  X,
  Image as ImageIcon,
  Palette,
  Sliders,
  MoreVertical,
  Pin,
  PinOff,
  Edit2,
  Check,
  Search,
  FileText,
  Download,
  Type,
  Volume2,
  Rocket,
  LogOut,
  LogIn,
  ArrowDown,
  DownloadCloud,
} from "lucide-react";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { toast } from "sonner";

const EMPTY_ARRAY: any[] = [];
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const { isLoggedIn, isGuest } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isAssistantMode, setIsAssistantMode] = useState<boolean | null>(null);
  useEffect(() => {
    if (isAssistantMode) {
      document.body.style.backgroundColor = "transparent";
      document.documentElement.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    }
  }, [isAssistantMode]);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  );
  const [timelineSearchQuery, setTimelineSearchQuery] = useState("");
  const [showWelcome, setShowWelcome] = useState(() => {
    return typeof window !== "undefined"
      ? !localStorage.getItem("loki_hasSeenWelcome")
      : false;
  });
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  const handleSidebarPWAInstall = async () => {
    if (isInstalled) {
      toast.success("Loki X Prime is already installed on your device!");
      return;
    }
    if (isIOS) {
      toast.info("To install on iOS: tap the Share button in Safari, then select 'Add to Home Screen'.");
      return;
    }
    if (isInstallable) {
      const installed = await installApp();
      if (installed) {
        toast.success("Loki X Prime installed successfully!");
      }
    } else {
      toast.info("To install: Open browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.");
    }
  };

  const isSettingsOpen = activeModal === "settings";
  const isAppsOpen = activeModal === "apps";
  const isCommandPaletteOpen = activeModal === "commands";
  const openModal = useCallback((modalName: string) => {
    setActiveModal(modalName);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const {
    theme,
    resolvedTheme,
    setTheme,
    bgStyle,
    setBgStyle,
    commanderName,
    setCommanderName,
    avatarUrl,
    setAvatarUrl,
    modelMode,
    setModelMode,
    tone,
    setTone,
    isAwakened,
    setIsAwakened,
    systemInstruction,
    setSystemInstruction,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    enterToSend,
    setEnterToSend,
    bubbleStyle,
    setBubbleStyle,
    fontSize,
    setFontSize,
    fontStyle,
    setFontStyle,
    soundEnabled,
    setSoundEnabled,
    messageAnimation,
    setMessageAnimation,
    autoScroll,
    setAutoScroll,
    typingSpeed,
    setTypingSpeed,
    showAvatars,
    setShowAvatars,
    responseLength,
    setResponseLength,
    accentColor,
    setAccentColor,
    messageDensity,
    setMessageDensity,
    thinkingMode,
    setThinkingMode,
    searchGrounding,
    setSearchGrounding,
    imageSize,
    setImageSize,
    liveAudioEnabled,
    setLiveAudioEnabled,
    animationSpeed,
    setAnimationSpeed,
    borderRadius,
    setBorderRadius,
    textReveal,
    setTextReveal,
    appWidth,
    setAppWidth,
    glowIntensity,
    setGlowIntensity,
    effectInputBox,
    effectMessageBubbles,
    effectSidebar,
    effectBackground,
    effectAvatar,
    sidebarPosition,
    chatAlignment,
    blurIntensity,
    timestampFormat,
    soundTheme,
    codeTheme,
    avatarShape,
    messageShadow,
    resetSettings,
    waveSpeed,
    waveThickness,
    waveGlow,
  } = useSettings();

  const { awakening, triggerAwakening: originalTriggerAwakening, handleAwakeningResponse } = useAwakening(
    isAwakened,
    setIsAwakened,
  );

  const triggerAwakening = useCallback((e: React.MouseEvent) => {
    originalTriggerAwakening(e);
  }, [originalTriggerAwakening]);

  const {
    sessions,
    currentSessionId,
    isLoading,
    createNewSession,
    deleteSession,
    deleteMessage,
    clearAllSessions,
    clearSessionMessages,
    setCurrentSessionId,
    sendMessage,
    stopGeneration,
    togglePinSession,
    renameSession,
    setSessionModelMode,
    saveSessionDraft,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const [inputHeight, setInputHeight] = useState(120);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputWrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setInputHeight(entry.contentRect.height);
      }
    });
    observer.observe(inputWrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isCommandPaletteOpen) {
          closeModal();
        } else {
          openModal("commands");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNewSession(modelMode);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    createNewSession,
    isCommandPaletteOpen,
    openModal,
    closeModal,
    modelMode,
  ]);

  const [showSkip, setShowSkip] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);


  useEffect(() => {
    const checkAssistantMode = async () => {
      // Check URL search params
      const params = new URLSearchParams(window.location.search);
      if (params.get("assistant") === "true") {
        setIsAssistantMode(true);
        return;
      }
      
      // Check for global flag (set by MainActivity)
      if ((window as any).isAssistantLaunch) {
        setIsAssistantMode(true);
        return;
      }
      
      setIsAssistantMode(false);
    };
    checkAssistantMode();

    // Listen for custom event from MainActivity
    const handleAssistantLaunch = () => {
      setIsAssistantMode(true);
    };
    window.addEventListener('assistantLaunch', handleAssistantLaunch);
    return () => window.removeEventListener('assistantLaunch', handleAssistantLaunch);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
      if (window.AndroidNative) {
        window.AndroidNative.showToast("Loki X Prime is running native!");
      }
    }, 4000);

    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(skipTimer);
    };
  }, []);

  // Handle PWA shortcuts and share target
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("settings") === "true") {
      openModal("settings");
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const command = urlParams.get("command");
    if (command) {
      // Handle web+loki:// protocol
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const shareText = urlParams.get("text");
    const shareUrl = urlParams.get("url");
    if (shareText || shareUrl) {
      // Handle share target
      const initialMessage = [shareText, shareUrl].filter(Boolean).join("\n");
      if (initialMessage && inputRef.current) {
        inputRef.current.setInput(initialMessage);
        // Trigger synthetic change event if needed by ChatInput
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [openModal]);

  useEffect(() => {
    // Auto-close sidebar on mobile initially
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // ⚡ BOLT OPTIMIZATION:
  // Dexie's useLiveQuery creates new array references for draftAttachments on every DB update.
  // We use useDeepCompareMemo to stabilize the reference before passing it to the heavily
  // memoized ChatInput, preventing expensive O(N) child re-renders during text streaming.
  const memoizedDraftAttachments = useDeepCompareMemo(() => {
    return currentSession?.draftAttachments || EMPTY_ARRAY;
  }, [currentSession?.draftAttachments]);

  // Search and sort timelines
  const sortedAndFilteredSessions = React.useMemo(() => {
    let result = [...sessions];

    // ⚡ Bolt: Trim and lowercase search query ONCE outside the filter loop
    // to avoid O(N) string allocations during search.
    const trimmedQuery = timelineSearchQuery.trim();
    if (trimmedQuery) {
      const lowerQuery = trimmedQuery.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(lowerQuery));
    }

    // Sort by pinned status first
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // Maintain recent updatedAt order from DB
    });

    return result;
  }, [sessions, timelineSearchQuery]);

  const rowVirtualizer = useVirtualizer({
    paddingStart: 80,
    paddingEnd: inputHeight + 80,
    count: currentSession?.messages.length || 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 140, // Responsive baseline for chat bubbles
    overscan: 5,
  });

  // Scroll to bottom when messages change, stream content arrives, or response finishes loading fully
  useEffect(() => {
    if (autoScroll && currentSession && currentSession.messages.length > 0) {
      const scrollToBottom = () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: isLoading ? "auto" : "auto", // Always use auto for reliable programmatic scrolling
          });
        }
      };

      // Perform a single reliable scroll
      scrollToBottom();
      
      // If still loading, we might need one raf to catch rapid DOM updates,
      // but we do NOT want multiple conflicting smooth scrolls.
      let rafId: number;
      let timeoutId: ReturnType<typeof setTimeout>;
      if (isLoading) {
         rafId = requestAnimationFrame(scrollToBottom);
      } else {
         // When finished loading, do one final exact snap after a short delay 
         // to ensure images or virtualizer are fully resolved.
         timeoutId = setTimeout(scrollToBottom, 150);
      }

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [
    currentSession?.messages.length,
    currentSession?.messages[currentSession.messages.length - 1]?.content,
    isLoading,
    currentSessionId,
    autoScroll,
    rowVirtualizer.getTotalSize(), // Crucial: trigger scroll when virtual list height changes
    inputHeight,
  ]);

  // Use IntersectionObserver to toggle scroll-to-bottom button
  useEffect(() => {
    const target = messagesEndRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Show scroll-to-bottom if the end ref is not intersecting
        setShowScrollToBottom(!entry.isIntersecting);
      },
      {
        root: scrollContainerRef.current,
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [currentSession?.messages.length, currentSessionId, isLoading]);

  const handleSetModelMode = useCallback((mode: string) => {
    setModelMode(mode as any);
    if (currentSessionId) {
      setSessionModelMode(currentSessionId, mode);
    }
  }, [currentSessionId, setModelMode, setSessionModelMode]);

  const handleSendMessage = useCallback(
    async (
      text: string,
      isImageMode?: boolean,
      audioUrl?: boolean | string,
      attachments?: { data: string; mimeType: string }[],
    ) => {
      await sendMessage(
        text,
        isImageMode,
        typeof audioUrl === "string" ? audioUrl : undefined,
        attachments,
      );
      if (window.innerWidth >= 768) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
      }
    },
    [sendMessage],
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      deleteSession(id);
    },
    [deleteSession],
  );

  const handleExportChat = () => {
    if (!currentSession || currentSession.messages.length === 0) return;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(currentSession.messages, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `loki_chat_export_${new Date().toISOString().split("T")[0]}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCreateNewSession = useCallback(() => {
    createNewSession(modelMode);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [createNewSession, modelMode]);

  const handleSessionClick = useCallback(
    (id: string) => {
      setCurrentSessionId(id);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    },
    [setCurrentSessionId, setIsSidebarOpen],
  );

  const formatDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    return format(date, "MMM d, HH:mm");
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

   const onEditMessageAction = useCallback((text: string) => {
    if (inputRef.current) {
      inputRef.current.setInput(text);
      inputRef.current.focus();
    }
  }, []);

  const handleDeleteMessage = useCallback((id: string) => {
    if (currentSessionId) {
      deleteMessage(currentSessionId, id);
    }
  }, [currentSessionId, deleteMessage]);

  const renderedMessages = (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const message = currentSession?.messages[virtualRow.index];
        if (!message) return null;

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <MessageBubble
              message={message}
              commanderName={commanderName}
              avatarUrl={avatarUrl}
              onEdit={message.role === "user" ? onEditMessageAction : undefined}
              onDelete={handleDeleteMessage}
              formatDate={formatDate}
              bubbleStyle={bubbleStyle}
              fontSize={fontSize}
              messageAnimation={messageAnimation}
              textReveal={textReveal}
              animationSpeed={animationSpeed}
              accentColor={accentColor}
              messageDensity={messageDensity}
              showAvatars={showAvatars}
              isAwakened={isAwakened || effectMessageBubbles}
              chatAlignment={chatAlignment}
              blurIntensity={blurIntensity}
              timestampFormat={timestampFormat}
              codeTheme={codeTheme}
              avatarShape={avatarShape}
              messageShadow={messageShadow}
              resolvedTheme={resolvedTheme}
            />
          </div>
        );
      })}
    </div>
  );

  if (isBooting) {
    return (
      <div
        className={`fixed inset-0 w-full h-full z-[9999] flex flex-col justify-between items-center transition-opacity duration-700 pb-12 pt-16 ${resolvedTheme === "light" ? "bg-[#ffffff]" : "bg-[#08080c]"}`}
      >
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-[300px] my-auto mx-auto">
          <div className="w-full max-w-[240px] aspect-[2/1] relative flex justify-center items-center">
            <InfinityLogo />
          </div>
          <div className="w-full h-[2px] bg-white/5 overflow-hidden rounded-sm">
            <div className="h-full bg-white animate-[fill-progress_1.5s_ease-in-out_forwards]" />
          </div>
          <p className="text-[#6b6b80] tracking-[6px] text-sm animate-[pulse-text_1.5s_infinite] font-montserrat font-bold uppercase">
            INITIALIZING SYSTEM
          </p>
        </div>
        <div className="mt-auto mb-8">
          <h1
            className="text-2xl sm:text-3xl font-black tracking-[0.3em] font-montserrat uppercase animate-[rgb-text_4s_linear_infinite] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)",
              backgroundSize: "200% auto",
              color: "white",
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            LOKI X PRIME
          </h1>
        </div>
      </div>
    );
  }

  const fontClass =
    fontStyle === "sans"
      ? "font-sans"
      : fontStyle === "serif"
        ? "font-serif"
        : "font-mono";

  const radiusVar =
    borderRadius === "sharp"
      ? "0px"
      : borderRadius === "pill"
        ? "9999px"
        : "16px";

  const appWidthClass =
    appWidth === "narrow"
      ? "max-w-2xl"
      : appWidth === "wide"
        ? "max-w-6xl"
        : "max-w-4xl";
  const glowOpacity =
    glowIntensity === "low" ? "0.2" : glowIntensity === "high" ? "0.8" : "0.5";

  if (isAssistantMode === null) {
    // Render an invisible layer while we check if it's assistant mode
    // to prevent the entire main app from flashing into view briefly
    return <div style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }} />;
  }

  if (isAssistantMode) {
    return (
      <div className={`app-wrapper ${theme} ${fontClass} bg-transparent`}>
        <AssistantOverlay onClose={() => setIsAssistantMode(false)} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1], // Custom sleek easing
        opacity: { duration: 0.8 }
      }}
      className={`app-wrapper ${resolvedTheme} ${isAwakened ? "awakened-mode" : ""} ${fontClass}`}
    >
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeModal} />
      <NetworkStatusIndicator />
      {/* 1. Background Layer (Fixed, never moves) */}
      <AwakenedBackground
        isAwakened={isAwakened || effectBackground}
        bgStyle={bgStyle}
        theme={resolvedTheme}
      />

      {/* Apps Modal */}
      <AppsModal
        isOpen={isAppsOpen}
        onClose={closeModal}
        commanderName={commanderName}
      />

      {/* Settings Modal - Full Screen Refined */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeModal}
        onExportChat={handleExportChat}
        onClearAllChats={clearAllSessions}
      />

      {/* Welcome Modal for First-time Users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
      />

      {/* 3. Main Content Layer (Flex Row/Column) */}
      <div
        className={`flex-1 flex min-h-0 z-10 relative ${isSidebarOpen ? (sidebarPosition === "right" ? "md:pr-72" : "md:pl-72") : ""} ${sidebarPosition === "right" ? "flex-row-reverse" : "flex-row"} transition-all duration-300`}
      >
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/85 dark:bg-black/85 z-40 md:hidden gpu-accelerate"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: isSidebarOpen
              ? 0
              : sidebarPosition === "right"
                ? "100%"
                : "-100%",
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 400,
            mass: 0.8,
          }}
          className={`fixed inset-y-0 ${sidebarPosition === "right" ? "right-0 border-l" : "left-0 border-r"} z-50 w-72 bg-[#f8fafc] dark:bg-[#0a0a0a] shadow-2xl border-y-0 border-slate-200/30 dark:border-white/5 flex flex-col transform-gpu gpu-accelerate`}
        >
          <div
            className="p-3.5 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 shrink-0"
            style={{
              paddingTop: "max(0.875rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))",
            }}
          >
            <div
              className={`flex items-center gap-2 font-montserrat font-bold ${isAwakened && theme === "light" ? "text-slate-900" : "text-slate-900 dark:text-white"}`}
            >
              <span className="text-cyan-600 dark:text-[#00f2ff]">TIME</span>{" "}
              LINES
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close Sidebar"
              className={`w-9 h-9 aspect-square rounded-full flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-white/10 transition-all ${isAwakened && theme === "light" ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white"} shadow-sm active:scale-95`}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              type="button"
              onClick={handleCreateNewSession}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.4)] font-bold text-xs border border-white/20 uppercase tracking-widest gpu-accelerate"
            >
              <Plus className="w-4 h-4" />
              NEW AWAKENING
            </motion.button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar touch-pan-y transform-gpu overscroll-contain"
            style={{
              paddingTop: "calc(4.25rem + env(safe-area-inset-top, 0px))",
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            <div className="text-[0.65rem] font-bold text-slate-500 dark:text-[#6b6b80] uppercase tracking-[0.3em] mb-2 px-3 mt-1">
              Recent Timelines
            </div>

            <div className="px-1 mb-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                aria-label="Search timelines"
                type="text"
                placeholder="Search timelines..."
                value={timelineSearchQuery}
                onChange={(e) => setTimelineSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg transition-all border outline-none
                  ${
                    isAwakened || effectSidebar
                      ? "bg-black/20 border-white/10 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:bg-black/40"
                      : "bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:border-cyan-500/30 focus:bg-white dark:focus:bg-black/40 shadow-sm"
                  }
                `}
              />
            </div>

            <AnimatePresence>
              {sortedAndFilteredSessions.map((session, index) => (
                <TimelineItem
                  key={session.id}
                  session={session}
                  index={index}
                  isActive={currentSessionId === session.id}
                  isAwakened={isAwakened}
                  effectSidebar={effectSidebar}
                  onClick={handleSessionClick}
                  onDelete={handleDeleteSession}
                  onPin={togglePinSession}
                  onRename={renameSession}
                />
              ))}
            </AnimatePresence>
            {sortedAndFilteredSessions.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-slate-500 dark:text-[#6b6b80] text-xs py-8 px-4 font-medium"
              >
                {sessions.length === 0
                  ? "No timelines yet. Initiate an awakening."
                  : "No matching timelines found."}
              </motion.div>
            )}
          </div>

          <div
            className="p-3 border-t border-slate-200/50 dark:border-white/5 space-y-1.5 mt-auto bg-[#f8fafc] dark:bg-[#0a0a0a]"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => openModal("apps")}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Rocket className="w-3.5 h-3.5" />
              TRY OUR APPS
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ filter: "brightness(1.2)" }}
              onClick={() => openModal("settings")}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-slate-600 dark:text-[#888] hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
            >
              <Settings className="w-3.5 h-3.5" />
              SYSTEM SETTINGS
            </motion.button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col min-w-0 relative h-full ${isAwakened ? "awakened-mode" : ""} ${isAwakened && resolvedTheme === "dark" ? "dark" : ""}`}
        >
          {/* Header */}
          <header
            className="absolute top-0 left-0 right-0 z-30 shrink-0 pointer-events-none select-none flex items-center justify-between px-3 sm:px-6 transition-all"
            style={{
              paddingTop: "max(0.65rem, env(safe-area-inset-top, 0px))",
              height: "calc(4.25rem + env(safe-area-inset-top, 0px))",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-4 flex-1 pointer-events-auto">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open Sidebar"
                  className="w-10 h-10 aspect-square rounded-full flex items-center justify-center shrink-0 bg-white/90 dark:bg-[#0a0a10]/90 hover:bg-white dark:hover:bg-white/20 border border-slate-200/90 dark:border-white/20 text-slate-800 dark:text-[#f0f0f5] shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer z-30"
                >
                  <PanelLeftOpen className="w-5 h-5 shrink-0" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center shrink-0 pointer-events-auto">
              {isLoading &&
              currentSession?.messages[currentSession.messages.length - 1]
                ?.role === "model" &&
              currentSession?.messages[currentSession.messages.length - 2]
                ?.isImage ? (
                <div className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded-full border border-cyan-500/40 bg-white/80 dark:bg-[#0a0a10]/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,242,255,0.2)] animate-in fade-in zoom-in duration-300 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 font-montserrat font-bold text-xs sm:text-sm tracking-[1px] sm:tracking-[2px] text-cyan-500 dark:text-cyan-400 leading-none">
                    <div className="w-5 h-2.5 sm:w-8 sm:h-4 shrink-0">
                      <HeaderInfinityLogo />
                    </div>
                    <span className="animate-pulse font-extrabold text-[0.7rem] sm:text-xs">GENERATING</span>
                    <span className="flex gap-1 items-center">
                      <span
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center justify-center h-10 px-4 sm:px-5 rounded-full border border-slate-200/90 dark:border-white/15 bg-white/80 dark:bg-[#0a0a10]/80 backdrop-blur-md shadow-sm transition-all hover:border-cyan-500/40 shrink-0">
                  <h1 className="flex items-center gap-1.5 sm:gap-2.5 font-montserrat font-bold text-sm sm:text-base tracking-[1.5px] sm:tracking-[2.5px] text-slate-900 dark:text-[#f0f0f5] leading-none">
                    <span className="font-extrabold tracking-[1.5px] sm:tracking-[2.5px]">LOKI</span>
                    <div className="w-6 h-3 sm:w-9 sm:h-4.5 flex items-center justify-center shrink-0">
                      <HeaderInfinityLogo />
                    </div>
                    <span className="text-[0.55rem] sm:text-[0.65rem] tracking-[1.5px] sm:tracking-[2.5px] font-black px-2 py-0.5 rounded-full border border-cyan-500/50 dark:border-[#00f2ff]/50 text-cyan-600 dark:text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.25)] bg-cyan-500/10 shrink-0 leading-tight">
                      PRIME
                    </span>
                  </h1>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-4 flex-1 pointer-events-auto">
              <div
                className={`relative w-10 h-10 aspect-square rounded-full cursor-pointer flex justify-center items-center shrink-0 hover:scale-105 transition-all opacity-100 ${awakening ? "scale-105" : ""}`}
                title={commanderName}
                onClick={triggerAwakening}
                onMouseDown={() => setIsAvatarActive(true)}
                onMouseUp={() => setIsAvatarActive(false)}
                onMouseLeave={() => setIsAvatarActive(false)}
                onTouchStart={() => setIsAvatarActive(true)}
                onTouchEnd={() => setIsAvatarActive(false)}
              >
                <AvatarShockwave isActive={isAvatarActive} />
                {(isAwakened || effectAvatar) && (
                  <div
                    className="absolute -inset-[2.5px] rounded-full z-[1] opacity-100 animate-spin-aura pointer-events-none"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00f0ff, #bd00ff, #ff00ff, #ff0000)",
                      boxShadow: "0 0 12px rgba(0, 242, 255, 0.5)",
                    }}
                  ></div>
                )}
                <div className={`w-10 h-10 aspect-square rounded-full overflow-hidden z-[2] relative shrink-0 ${(isAwakened || effectAvatar) ? "border-2 border-white dark:border-[#08080c] shadow-md" : "border border-slate-200/90 dark:border-white/20 shadow-sm"}`}>
                  <img
                    src="/Picsart-26-02-28-11-29-26-443.jpg"
                    className="w-full h-full object-cover rounded-full aspect-square block"
                    alt="Commander"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* Chat Area - Scrollable */}
          <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-x-hidden custom-scrollbar relative w-full transform-gpu ${!currentSession || currentSession.messages.length === 0 ? "overflow-hidden" : "overflow-y-auto overscroll-contain"}`}
            style={{
              WebkitOverflowScrolling: "touch",
              transform: "translateZ(0)",
              willChange: "transform",
            }}
          >
            {/* Inner spacer for header */}
            <div className="w-full shrink-0" style={{ height: "calc(4.25rem + env(safe-area-inset-top, 0px))" }} />

            <div
              className={`w-full ${appWidthClass} mx-auto px-3 sm:px-6 h-full flex flex-col ${!currentSession || currentSession.messages.length === 0 ? "justify-center items-center" : "pt-2 space-y-6 sm:space-y-8"}`}
              style={
                !currentSession || currentSession.messages.length === 0
                  ? {
                      height: "calc(100% - 4.5rem - env(safe-area-inset-top, 0px))",
                    }
                  : {}
              }
            >
              {!currentSession || currentSession.messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center text-center space-y-6 w-full h-full touch-none select-none my-auto"
                  onTouchMove={(e) => e.preventDefault()} // CRITICAL: Stop pull-to-refresh/scroll on empty state
                >
                  <div
                    className={`relative flex justify-center items-center transition-all duration-700 ${isAwakened ? "w-full max-w-[480px] sm:max-w-[700px] aspect-[2/1]" : "w-full max-w-[200px] sm:max-w-[280px] aspect-[2/1]"}`}
                  >
                    {isAwakened ? (
                      <div className="relative w-full h-full awakened-logo-container flex items-center justify-center">
                        {/* Hardware-accelerated RGB Aura Border */}
                        <div className="absolute inset-0 awakened-logo-aura"></div>
                        {/* Sweeping Shine Overlay */}
                        <div className="absolute inset-0 awakened-logo-shine"></div>
                        {/* Main Transparent Logo */}
                        <img
                          src="/Picsart_26-03-05_20-52-27-601.png"
                          alt="Loki Prime Logo"
                          className="w-full h-full object-contain relative z-10 awakened-logo-image"
                        />
                      </div>
                    ) : (
                      <InfinityLogo />
                    )}
                  </div>
                  <div
                    className="relative"
                    style={{
                      transition: "opacity 0.3s ease, max-height 0.3s ease",
                      overflow: "hidden",
                    }}
                  >
                    <p
                      className={`text-slate-500 dark:text-[#6b6b80] tracking-[4px] sm:tracking-[8px] text-[0.65rem] sm:text-xs font-montserrat font-bold uppercase drop-shadow-sm px-4 transition-all duration-1000 ${isAwakened ? (resolvedTheme === "light" ? "text-cyan-600 animate-pulse" : "text-cyan-300 animate-pulse") : "opacity-80 hover:opacity-100"}`}
                      style={
                        isAwakened
                          ? { textShadow: "0 0 15px rgba(0,242,255,0.6)" }
                          : {}
                      }
                    >
                      {isAwakened
                        ? "SYSTEM AWAKENED. AWAITING INPUT."
                        : `AWAITING COMMAND, ${commanderName.toUpperCase()}.`}
                    </p>
                    {isAwakened && (
                      <div className="absolute -inset-4 bg-cyan-500/5 blur-xl rounded-full -z-10 animate-pulse"></div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <>
                  {renderedMessages}
                  <div ref={messagesEndRef} className="shrink-0 pointer-events-none" style={{ height: 1 }} />
                </>
              )}
            </div>
          </div>

          {/* Scroll to Bottom Button Container */}
          <div className={`absolute bottom-36 sm:bottom-40 left-0 right-0 w-full ${appWidthClass} mx-auto z-30 pointer-events-none`}>
            <AnimatePresence>
              {showScrollToBottom &&
                currentSession &&
                currentSession.messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({
                          top: scrollContainerRef.current.scrollHeight,
                          behavior: "smooth",
                        });
                      }
                      messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                      });
                    }}
                    className="absolute bottom-4 right-4 sm:right-8 p-3 rounded-full flex items-center justify-center bg-cyan-600/90 backdrop-blur-md text-white shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] hover:bg-cyan-500 transition-all duration-300 border-2 border-cyan-400/50 pointer-events-auto"
                    aria-label="Scroll to bottom"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                )}
            </AnimatePresence>
          </div>

          {/* Input Area - Floating (Absolute) */}
          <div
            ref={inputWrapperRef}
            className={`absolute bottom-0 left-0 right-0 z-20 w-full ${appWidthClass} mx-auto input-keyboard-safe-area pointer-events-none`}
            style={{
              paddingBottom: "max(5px, env(safe-area-inset-bottom, 0px))",
              paddingTop: "8px",
            }}
          >
            <div className="pointer-events-auto">
              <ChatInput
                ref={inputRef}
                isAwakened={isAwakened}
                isLoading={isLoading}
                modelMode={currentSession?.modelMode || modelMode}
                setModelMode={handleSetModelMode}
                onSendMessage={handleSendMessage}
                onDeleteSession={handleDeleteSession}
                currentSessionId={currentSessionId}
                onStopGeneration={stopGeneration}
                enterToSend={enterToSend}
                draftText={currentSession?.draftText || ""}
                draftAttachments={memoizedDraftAttachments}
                saveSessionDraft={saveSessionDraft}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Awakening Shockwave Overlay (Overlays entire screen and all UI components) */}
      {awakening && (
        <div className="fixed inset-0 z-[999999] pointer-events-none overflow-hidden">
          <WebGLShockwave
            config={{ waveSpeed, waveThickness, waveGlow, particleSpeed: 1.0 }}
            originX={
              typeof window !== "undefined" && window.innerWidth > 0
                ? (awakening.startX + (awakening.width || 40) / 2) / window.innerWidth
                : 0.85
            }
            originY={
              typeof window !== "undefined" && window.innerHeight > 0
                ? 1.0 - (awakening.startY + (awakening.height || 40) / 2) / window.innerHeight
                : 0.92
            }
          />
        </div>
      )}
    </motion.div>
  );
}

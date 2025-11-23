import React, { useState, useRef, useEffect } from 'react';
import { ContextPanel } from './components/ContextPanel';
import { ChatMessage, MessageRole, ContextItem, GenerationConfig, LoadingState } from './types';
import { streamGeminiResponse } from './services/geminiService';
import { Button } from './components/Button';
import { MarkdownViewer } from './components/MarkdownViewer';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.SYSTEM,
      text: "Welcome to Arch.io. I am your engineering assistant. \n\nI can explain concepts, refactor code, or analyze text you paste in the Context Lab sidebar (simulating RAG). \n\nTry asking: **'Explain the difference between TCP and UDP'** or paste some JSON in the Context Lab and ask me to generate TypeScript interfaces for it.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Config state
  const [thinkingBudget, setThinkingBudget] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loadingState !== 'idle') return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.USER,
      text: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingState('streaming');

    // Create a placeholder for the AI message
    const aiMessageId = crypto.randomUUID();
    const initialAiMessage: ChatMessage = {
      id: aiMessageId,
      role: MessageRole.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialAiMessage]);

    try {
      const config: GenerationConfig = {
        thinkingBudget: thinkingBudget,
        useContext: true
      };

      let accumulatedText = "";

      await streamGeminiResponse(
        userMessage.text, 
        contextItems, 
        config, 
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: accumulatedText }
              : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, text: "**Error:** Failed to generate response. Please check your API key or try again." }
          : msg
      ));
    } finally {
      setLoadingState('idle');
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      // Auto-focus input after completion
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-800 rounded text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar (Context Lab) */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 h-full transition-transform duration-300 shadow-xl md:shadow-none`}>
        <ContextPanel items={contextItems} setItems={setContextItems} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full max-w-full">
        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3 md:ml-0 ml-12">
            <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="font-bold text-lg tracking-tight">Arch.io</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Beta</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group" title="Uses thinking budget for complex reasoning">
              <span className={`text-xs font-medium transition-colors ${thinkingBudget > 0 ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>Deep Reason</span>
              <div 
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${thinkingBudget > 0 ? 'bg-indigo-600' : 'bg-slate-700'}`}
                onClick={() => setThinkingBudget(prev => prev > 0 ? 0 : 4096)}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${thinkingBudget > 0 ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] lg:max-w-[70%] rounded-2xl p-5 shadow-sm ${
                msg.role === MessageRole.USER 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-surface border border-slate-700 rounded-bl-none'
              }`}>
                {msg.role === MessageRole.USER ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className={msg.isStreaming ? 'typing-cursor' : ''}>
                    <MarkdownViewer content={msg.text} />
                  </div>
                )}
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === MessageRole.USER ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.role === MessageRole.MODEL && thinkingBudget > 0 && <span className="ml-2">• Deep Reason</span>}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background border-t border-slate-800">
          <div className="max-w-4xl mx-auto relative rounded-xl bg-surface border border-slate-700 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a software concept, pattern, or paste a bug..."
              className="w-full bg-transparent text-slate-200 p-4 pr-14 max-h-48 min-h-[60px] resize-none focus:outline-none scrollbar-hide"
              rows={1}
              style={{ height: 'auto', minHeight: '60px' }}
            />
            <div className="absolute right-2 bottom-2">
              <Button 
                size="sm" 
                onClick={() => handleSubmit()} 
                disabled={!input.trim() || loadingState !== 'idle'}
                className="rounded-lg h-10 w-10 p-0 flex items-center justify-center"
              >
                {loadingState === 'streaming' ? (
                  <span className="h-2 w-2 bg-white rounded-full animate-ping"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">
            Arch.io can make mistakes. Verify important architectural decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Headset } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Precisa de ajuda para escolher seu perfil ou proxy hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessageToGemini(historyForApi, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Não consegui processar sua mensagem.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[500px] bg-dark-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden border border-dark-700 animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="bg-dark-900 p-4 flex justify-between items-center border-b border-dark-700">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600/20 p-2 rounded-full border border-primary-500/30">
                <Headset size={18} className="text-primary-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Suporte AssisAds</h3>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Online agora
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-dark-800 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-dark-700 text-gray-200 rounded-bl-none border border-dark-600'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-700 border border-dark-600 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-dark-900 border-t border-dark-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua dúvida..."
                className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors placeholder-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-900/40 transition-all hover:scale-105 flex items-center gap-2 group border-2 border-green-400"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} fill="currentColor" />}
        {!isOpen && <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold pl-1 text-sm">Ajuda?</span>}
      </button>
    </div>
  );
};

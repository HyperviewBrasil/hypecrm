import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiCpu } from 'react-icons/fi';

interface Message {
  text: string;
  sender: 'user' | 'ai';
  isTyping?: boolean;
}

interface AIChatProps {
  webhookUrl: string;
  initialMessage?: string | null;
}

// Regex to detect Supabase media URLs for images and videos
const mediaUrlRegex = /(https:\/\/hxgasuppbciqlytlebty\.supabase\.co\/storage\/v1\/object\/public\/media\/[^\s]+(\.(?:mp4|webm|png|jpg|jpeg|gif)))/gi;

// Component to render message content, including media
const MessageContent: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(mediaUrlRegex).filter(part => part);

    return (
        <>
            {parts.map((part, index) => {
                if (part.match(mediaUrlRegex)) {
                    const isVideo = /\.(mp4|webm)$/i.test(part);
                    if (isVideo) {
                        return (
                            <video
                                key={index}
                                src={part}
                                controls
                                muted
                                autoPlay
                                loop
                                className="w-full rounded-lg my-2 max-w-xs"
                            />
                        );
                    } else {
                        return (
                            <img
                                key={index}
                                src={part}
                                alt="Conteúdo da IA"
                                className="w-full rounded-lg my-2 max-w-xs"
                            />
                        );
                    }
                }
                if (part.trim()) {
                    return <p key={index} className="text-sm whitespace-pre-wrap">{part.trim()}</p>;
                }
                return null;
            })}
        </>
    );
};

const AIChat: React.FC<AIChatProps> = ({ webhookUrl, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Olá! Sou o Hype, assistente virtual da Hyperview. Como posso ajudar com seu projeto de holografia hoje? Posso mostrar exemplos de nossos trabalhos, se desejar.", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialMessageSent = useRef(false); // Ref to prevent infinite loop

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = { text: messageText, sender: 'user' };
    const conversationHistory = messages.map(({ isTyping, ...rest }) => rest);
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setMessages(prev => [...prev, { text: "", sender: 'ai', isTyping: true }]);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, history: [...conversationHistory, userMessage] }),
      });

      if (!response.ok) throw new Error('Falha na comunicação com o assistente.');

      const agentResponse = await response.json();
      let agentMessageText: string;
      let dataToProcess = agentResponse;

      if (Array.isArray(agentResponse) && agentResponse.length > 0) {
          dataToProcess = agentResponse[0];
      }

      if (dataToProcess && typeof dataToProcess.output === 'string') {
          agentMessageText = dataToProcess.output;
      } else {
          agentMessageText = "Recebi uma resposta, mas não consegui entender o formato. Por favor, verifique a configuração do webhook no n8n.";
      }
      
      const aiMessage: Message = { text: agentMessageText, sender: 'ai' };
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = aiMessage;
        return newMessages;
      });

    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = { text: "Ocorreu um erro. Por favor, tente novamente mais tarde.", sender: 'ai' };
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = errorMessage;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [messages, webhookUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSend(input);
    setInput('');
  };
  
  useEffect(() => {
    // Focus on initial render
    if (!initialMessageSent.current) {
        inputRef.current?.focus();
    }
    
    // Send the initial message only once, preventing a loop.
    if (initialMessage && !initialMessageSent.current) {
        initialMessageSent.current = true; // Set flag before sending to prevent re-triggering
        handleSend(initialMessage);
    }
  }, [initialMessage, handleSend]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <FiCpu className="text-blue-400" />
          <h3 className="font-semibold text-white">Atendente Virtual Hyperview</h3>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-black/10" style={{ backgroundImage: 'url(https://hxgasuppbciqlytlebty.supabase.co/storage/v1/object/public/media/fundochat.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"><FiCpu className="text-blue-400"/></div>}
              <div
                className={`max-w-[80%] p-3 rounded-2xl backdrop-blur-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/80 text-white rounded-br-none'
                    : 'bg-gray-900/80 text-gray-200 rounded-bl-none'
                }`}
              >
                {msg.isTyping ? (
                  <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                  </div>
                ) : (
                  <MessageContent text={msg.text} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <footer className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="w-full px-4 py-2 border bg-gray-900 border-gray-600 text-white rounded-full focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <FiSend size={18} />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default AIChat;
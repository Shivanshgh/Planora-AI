import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Loader2,
  Calendar,
  Wallet,
  Users,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { EventPlan, ChatMessage } from '../../types/event';
import { apiService } from '../../services/apiService';
import { formatINR } from '../../utils/formatters';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan | null;
  onUpdatePlan?: (updatedPlan: EventPlan) => void;
}

export const AssistantModal: React.FC<AssistantModalProps> = ({
  isOpen,
  onClose,
  plan,
  onUpdatePlan,
}) => {
  const getInitialMessages = (): ChatMessage[] => {
    if (plan?.chatHistory && plan.chatHistory.length > 0) {
      return plan.chatHistory;
    }
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: plan
          ? `Hello! I'm your Planora Event Concierge. I have full context on "${plan.input.name}" (${plan.input.eventType} in ${plan.input.city} with ₹${plan.input.totalBudget.toLocaleString('en-IN')} budget). How can I help you today?`
          : `Hello! I'm your Planora Event Concierge. Ask me anything about event budgeting, vendors, wedding etiquette, or birthday party schedules!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDialogAccessibility(isOpen, dialogRef, onClose, 'input[aria-label="Ask the event assistant a question"]');

  // Sync messages when plan changes
  useEffect(() => {
    if (isOpen) {
      setMessages(getInitialMessages());
    }
  }, [plan?.id, isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const updateChatMessages = (newHistory: ChatMessage[]) => {
    setMessages(newHistory);
    if (plan && onUpdatePlan) {
      onUpdatePlan({
        ...plan,
        chatHistory: newHistory,
      });
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset conversation history for this event?')) {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: plan
            ? `Conversation reset. I have active context on "${plan.input.name}". How can I help you?`
            : `Conversation reset. How can I assist you?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      updateChatMessages(resetMessages);
    }
  };

  const quickPrompts = [
    'Draft a WhatsApp invitation message',
    'Suggest a 5-hour run-of-show timeline',
    'What are 3 tips to negotiate with the caterer?',
    'What emergency items should I carry on the day?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || inputQuestion).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedAfterUser = [...messages, userMsg];
    updateChatMessages(updatedAfterUser);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const reply = await apiService.askAssistant(
        plan,
        messages.map(m => ({ sender: m.sender, text: m.text })),
        textToSend
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      updateChatMessages([...updatedAfterUser, assistantMsg]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please verify Gemini API key configuration.';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue: ${message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      updateChatMessages([...updatedAfterUser, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="assistant-dialog-title" className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[640px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5 text-violet-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="assistant-dialog-title" className="font-bold text-sm text-white">Planora Event Concierge</h3>
                <span className="text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.2 rounded">
                  AI Contextual
                </span>
                {plan?.chatHistory && plan.chatHistory.length > 1 && (
                  <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    History Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {plan ? `${plan.input.name} • ${formatINR(plan.input.totalBudget)}` : 'General Event Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Clear conversation history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              aria-label="Close assistant"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" role="log" aria-label="Assistant conversation" aria-live="polite" aria-relevant="additions">
          {messages.map(m => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? 'text-violet-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2" role="status" aria-live="polite">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span>Analyzing event context and composing reply...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Try:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 shrink-0 border border-slate-200 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            aria-label="Ask the event assistant a question"
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            placeholder="Ask about vendors, run-of-show timings, budget advice..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
};

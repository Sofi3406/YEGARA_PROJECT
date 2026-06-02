import React, { useEffect, useRef, useState } from 'react';
import { chatbotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const ResidentChatbotWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const canSend = input.trim().length > 0 && !loading;
  const isResident = user?.role === 'resident';
  const isLandingPage = location.pathname === '/';
  const shouldRender = isResident || isLandingPage;
  const chatContextKey = isResident ? `resident-${user?._id || 'unknown'}` : 'public-landing';

  const welcomeMessage = isResident
    ? `Hello${user?.fullName ? ` ${user.fullName}` : ''}. Ask me about reports, events, announcements, and platform guidance.`
    : 'Hello Visitor! Welcome to Yegara Community Report Tracking and Event Management System. Ask me about registration, using the system, reports, announcements, and events.';

  useEffect(() => {
    if (!shouldRender) return;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: welcomeMessage
      }
    ]);
    setInput('');
    setLoading(false);
  }, [chatContextKey, shouldRender, welcomeMessage]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const appendMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text }
    ]);
  };

  const sendQuestion = async (question) => {
    const trimmed = String(question || '').trim();
    if (!trimmed || loading) return;

    appendMessage('user', trimmed);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const response = isResident
        ? await chatbotAPI.ask(trimmed)
        : await chatbotAPI.askPublic(trimmed);
      const answer = response?.data?.data?.answer || 'Chatbot is currently unavailable. Please try again later.';
      appendMessage('assistant', answer);
    } catch (error) {
      appendMessage('assistant', 'Chatbot is currently unavailable. Please try again later.');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[92vw] max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ask Chatbot</p>
              <p className="text-[11px] text-amber-100">{isResident ? 'Resident assistant' : 'Public assistant'}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-amber-500/50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'ml-auto bg-gradient-to-r from-amber-600 to-orange-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-white border border-gray-200 text-gray-600">
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-gray-200 p-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'assistant',
                    text: welcomeMessage
                  }
                ]);
                setInput('');
              }}
              className="w-full rounded-lg border border-gray-200 text-gray-700 text-xs font-medium py-2 hover:bg-gray-50"
            >
              Clear chat and restart
            </button>

            {!isResident && isLandingPage && (
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full rounded-lg border border-amber-200 text-amber-800 text-sm font-medium py-2 hover:bg-amber-50"
              >
                Create Resident Account
              </button>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-orange-700 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[11px] text-gray-500">
              Ask about reports, tracking status, registration, announcements, events, or meetings.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 text-white px-4 py-3 shadow-lg hover:brightness-110"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Ask Chatbot</span>
      </button>
    </>
  );
};

export default ResidentChatbotWidget;

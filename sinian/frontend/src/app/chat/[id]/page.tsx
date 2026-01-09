'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Heart, User, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { personApi, chatApi } from '@/lib/api';
import type { NostalgiaPerson } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const personId = Number(params.id);
  const [person, setPerson] = useState<NostalgiaPerson | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPerson();
  }, [personId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const loadPerson = async () => {
    try {
      const response = await personApi.getById(personId);
      setPerson(response.data);
    } catch (error) {
      console.error('加载思念人信息失败:', error);
      alert('加载失败');
      router.push('/');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);
    setTyping(true);

    try {
      const response = await chatApi.send({ personId, message: userMessage });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败，请重试');
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-warm-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-primary-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-warm-400 rounded-2xl flex items-center justify-center shadow-md overflow-hidden">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`http://localhost:8080/api/uploads/${person.photoUrl}`}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Heart className="w-6 h-6 text-white fill-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{person.name}</h1>
              {person.relationship && (
                <p className="text-sm text-primary-600">{person.relationship}</p>
              )}
            </div>
          </div>
          {person.voiceUrl && (
            <button className="p-2 hover:bg-primary-50 rounded-xl transition-colors">
              <Volume2 className="w-5 h-5 text-primary-600" />
            </button>
          )}
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-primary-400 fill-primary-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                开始与{person.name}对话
              </h2>
              <p className="text-gray-600">
                发送消息，AI将以{person.name}的个性回应你
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-pink-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={1}
                placeholder={`对${person.name}说点什么...`}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none bg-white"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '48px';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

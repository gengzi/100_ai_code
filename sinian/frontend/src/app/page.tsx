'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { personApi } from '@/lib/api';
import type { NostalgiaPerson } from '@/types';

export default function Home() {
  const [persons, setPersons] = useState<NostalgiaPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      const response = await personApi.getAll();
      setPersons(response.data);
    } catch (error) {
      console.error('加载思念人列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      {/* 头部 */}
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-warm-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-warm-600 bg-clip-text text-transparent">
                思念AI
              </h1>
              <p className="text-sm text-gray-600">永恒的陪伴，让爱永不消逝</p>
            </div>
          </div>
          <Link
            href="/persons/create"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">创建思念人</span>
          </Link>
        </div>
      </header>

      {/* 欢迎区域 */}
      <section className="max-w-4xl mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm text-primary-700 mb-6 shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>AI驱动的数字陪伴系统</span>
        </div>
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-warm-500 to-primary-600 bg-clip-text text-transparent">
          温暖的回忆，永久的陪伴
        </h2>
        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          创建你思念的人的AI克隆体，通过照片、语音和记忆，
          <br />
          让大模型重现他们的个性，与你温暖对话
        </p>
      </section>

      {/* 思念人列表 */}
      <section className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : persons.length === 0 ? (
          <div className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-primary-200">
            <Heart className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">还没有思念人</h3>
            <p className="text-gray-600 mb-6">点击上方按钮，创建第一个AI克隆体吧</p>
            <Link
              href="/persons/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>创建思念人</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {persons.map((person) => (
              <Link
                key={person.id}
                href={`/chat/${person.id}`}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-pink-100"
              >
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-warm-100 rounded-2xl mb-4 overflow-hidden">
                  {person.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`http://localhost:8080/api/uploads/${person.photoUrl}`}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-16 h-16 text-primary-300" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{person.name}</h3>
                {person.relationship && (
                  <p className="text-sm text-primary-600 mb-2">{person.relationship}</p>
                )}
                {person.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{person.description}</p>
                )}
                <div className="flex items-center gap-2 text-primary-600">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">开始对话</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

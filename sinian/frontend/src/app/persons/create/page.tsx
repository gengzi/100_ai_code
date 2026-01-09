'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Heart, User, FileText, Mic } from 'lucide-react';
import Link from 'next/link';
import { personApi } from '@/lib/api';
import type { CreatePersonRequest } from '@/types';

export default function CreatePersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePersonRequest>({
    name: '',
    description: '',
    relationship: '',
    personality: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 创建思念人
      const response = await personApi.create(formData);
      const personId = response.data.id;

      // 上传照片
      if (photoFile) {
        await personApi.uploadPhoto(personId, photoFile);
      }

      // 上传语音
      if (voiceFile) {
        await personApi.uploadVoice(personId, voiceFile);
      }

      // 跳转到聊天页面
      router.push(`/chat/${personId}`);
    } catch (error) {
      console.error('创建失败:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoiceFile(file);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </Link>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-warm-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-9 h-9 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-warm-600 bg-clip-text text-transparent">
            创建思念人
          </h1>
          <p className="text-gray-600 mt-2">填写信息，让AI重现他们的温暖</p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-pink-100">
          {/* 照片上传 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <User className="w-5 h-5 text-primary-500" />
              <span>照片</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full aspect-[2] bg-gradient-to-br from-primary-50 to-warm-50 border-2 border-dashed border-primary-200 rounded-2xl cursor-pointer hover:border-primary-400 transition-colors"
              >
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="预览"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-primary-400 mb-2" />
                    <span className="text-sm text-gray-600">点击上传照片</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* 姓名 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-primary-500" />
              <span>姓名 *</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              placeholder="输入姓名"
            />
          </div>

          {/* 关系 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Heart className="w-4 h-4 text-primary-500" />
              <span>与你的关系</span>
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              placeholder="例如：爷爷、妈妈、最好的朋友"
            />
          </div>

          {/* 描述 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-primary-500" />
              <span>关于TA</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
              placeholder="简单描述一下这个人..."
            />
          </div>

          {/* 个性特征和记忆 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>个性特征和记忆</span>
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
              placeholder="描述TA的性格、口头禅、重要记忆等，这些信息将帮助AI更好地重现TA..."
            />
          </div>

          {/* 语音上传 */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Mic className="w-5 h-5 text-primary-500" />
              <span>语音样本（可选）</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleVoiceChange}
                className="hidden"
                id="voice-upload"
              />
              <label
                htmlFor="voice-upload"
                className="flex items-center justify-center gap-3 w-full py-4 bg-warm-50 border-2 border-dashed border-warm-200 rounded-xl cursor-pointer hover:border-warm-400 transition-colors"
              >
                <Mic className="w-6 h-6 text-warm-500" />
                <span className="text-sm text-gray-600">
                  {voiceFile ? voiceFile.name : '点击上传语音文件'}
                </span>
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>创建中...</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                <span>创建AI克隆体</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function Sparkles({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

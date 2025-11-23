import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { PatternSettings } from '../types';

interface ImageUploadProps {
  onImageUpload: (file: File, settings: PatternSettings) => void;
  settings: PatternSettings;
  onSettingsChange: (settings: PatternSettings) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  settings,
  onSettingsChange,
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！');
      return;
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件大小不能超过10MB！');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      await onImageUpload(file, settings);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试！');
    } finally {
      setIsProcessing(false);
    }
  }, [onImageUpload, settings]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    disabled: isProcessing
  });

  const clearPreview = () => {
    setPreview(null);
  };

  const handleSettingChange = (key: keyof PatternSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 设置面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">图解设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 宽度设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图解宽度（格子数）
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={settings.width}
              onChange={(e) => handleSettingChange('width', parseInt(e.target.value) || 50)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* 高度设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图解高度（格子数）
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={settings.height}
              onChange={(e) => handleSettingChange('height', parseInt(e.target.value) || 50)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* 每行针数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              每行针数
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={settings.stitchesPerRow}
              onChange={(e) => handleSettingChange('stitchesPerRow', parseInt(e.target.value) || 20)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* 最大颜色数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大颜色数
            </label>
            <select
              value={settings.maxColors}
              onChange={(e) => handleSettingChange('maxColors', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={3}>3种颜色</option>
              <option value={5}>5种颜色</option>
              <option value={8}>8种颜色</option>
              <option value={12}>12种颜色</option>
              <option value={16}>16种颜色</option>
            </select>
          </div>

          {/* 颜色简化程度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              颜色简化程度
            </label>
            <select
              value={settings.colorSimplification}
              onChange={(e) => handleSettingChange('colorSimplification', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={0}>不简化</option>
              <option value={0.3}>轻度简化</option>
              <option value={0.5}>中度简化</option>
              <option value={0.7}>高度简化</option>
            </select>
          </div>

          {/* 针法类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主要针法
            </label>
            <select
              value={settings.stitchType}
              onChange={(e) => handleSettingChange('stitchType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="single">短针 (X)</option>
              <option value="double">长针 (V)</option>
              <option value="half-double">中长针 (H)</option>
              <option value="treble">特长针 (T)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">上传图片</h3>

        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />

          {preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="预览图片"
                  className="max-h-64 rounded-lg shadow-sm"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearPreview();
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                点击或拖拽新图片来替换
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload size={48} className="text-gray-400" />
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isProcessing ? '正在处理图片...' :
                   isDragActive ? '放开鼠标上传图片' :
                   '点击或拖拽图片到此处'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 JPG、PNG、GIF、WebP 格式，最大 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 黑色线条处理选项 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">图片处理</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🎨</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">移除黑色线条</div>
                  <div className="text-sm text-gray-600">自动识别并移除图片中的黑色轮廓线，用周边颜色填充</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('removeBlackLines', !settings.removeBlackLines)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.removeBlackLines ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.removeBlackLines ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p><strong>提示:</strong> 此功能适合处理有黑色轮廓线的卡通图片、简笔画等。对于摄影图片建议关闭此选项。</p>
          </div>
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 使用提示</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 选择对比度高、颜色简洁的图片效果最佳</li>
          <li>• 建议图片尺寸不小于 200x200 像素</li>
          <li>• 复杂图片建议增加颜色简化程度</li>
          <li>• 可根据实际需求调整图解大小和每行针数</li>
          <li>• 有黑色线条的图片建议开启"移除黑色线条"功能</li>
        </ul>
      </div>
    </div>
  );
};
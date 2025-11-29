import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Settings, Layers, Zap } from 'lucide-react';
import { PatternSettings, Depth3DSettings, Image3DResult } from '../types';

interface Image3DUploadProps {
  onImage3DUpload: (file: File, settings: PatternSettings, depth3DSettings: Depth3DSettings) => void;
  settings: PatternSettings;
  onSettingsChange: (settings: PatternSettings) => void;
  depth3DSettings: Depth3DSettings;
  onDepth3DSettingsChange: (depth3DSettings: Depth3DSettings) => void;
  className?: string;
}

export const Image3DUpload: React.FC<Image3DUploadProps> = ({
  onImage3DUpload,
  settings,
  onSettingsChange,
  depth3DSettings,
  onDepth3DSettingsChange,
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [depthPreview, setDepthPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件！');
      return;
    }

    // 验证文件大小（最大15MB，因为3D处理更消耗资源）
    if (file.size > 15 * 1024 * 1024) {
      alert('图片文件大小不能超过15MB！');
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);

      setIsProcessing(true);
      try {
        await onImage3DUpload(file, settings, depth3DSettings);
      } catch (error) {
        console.error('3D图片处理失败:', error);
        alert('3D图片处理失败，请重试！');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onImage3DUpload, settings, depth3DSettings]);

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
    setDepthPreview(null);
  };

  const handleSettingChange = (key: keyof PatternSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleDepth3DSettingChange = (key: keyof Depth3DSettings, value: any) => {
    onDepth3DSettingsChange({
      ...depth3DSettings,
      [key]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 3D设置面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">3D图解设置</h3>
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <Zap className="w-4 h-4" />
            <span>3D增强</span>
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              基础设置
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              高级3D设置
            </button>
          </nav>
        </div>

        {/* 基础设置 */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 宽度设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图解宽度（格子数）
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={settings.width}
                onChange={(e) => handleSettingChange('width', parseInt(e.target.value) || 40)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                max="100"
                value={settings.height}
                onChange={(e) => handleSettingChange('height', parseInt(e.target.value) || 40)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* 3D深度层数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3D深度层数
              </label>
              <select
                value={depth3DSettings.layerCount}
                onChange={(e) => handleDepth3DSettingChange('layerCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value={3}>3层（简单）</option>
                <option value={5}>5层（中等）</option>
                <option value={8}>8层（丰富）</option>
                <option value={12}>12层（精细）</option>
                <option value={16}>16层（超精细）</option>
                <option value={20}>20层（极致）</option>
              </select>
            </div>

            {/* 深度强度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                深度强度 ({depth3DSettings.depthIntensity.toFixed(1)})
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={depth3DSettings.depthIntensity}
                onChange={(e) => handleDepth3DSettingChange('depthIntensity', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value={0}>不简化</option>
                <option value={0.3}>轻度简化</option>
                <option value={0.5}>中度简化</option>
                <option value={0.7}>高度简化</option>
              </select>
            </div>
          </div>
        )}

        {/* 高级3D设置 */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 对比度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图像对比度 ({depth3DSettings.contrast.toFixed(1)})
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={depth3DSettings.contrast}
                  onChange={(e) => handleDepth3DSettingChange('contrast', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 亮度 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图像亮度 ({depth3DSettings.brightness.toFixed(1)})
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={depth3DSettings.brightness}
                  onChange={(e) => handleDepth3DSettingChange('brightness', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* 3D处理选项 */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">颜色深度</div>
                      <div className="text-sm text-gray-600">基于颜色信息生成3D深度效果</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDepth3DSettingChange('colorDepth', !depth3DSettings.colorDepth)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    depth3DSettings.colorDepth ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      depth3DSettings.colorDepth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">深度平滑</div>
                      <div className="text-sm text-gray-600">平滑3D深度过渡，减少锯齿效果</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDepth3DSettingChange('smoothing', !depth3DSettings.smoothing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    depth3DSettings.smoothing ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      depth3DSettings.smoothing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">边缘增强</div>
                      <div className="text-sm text-gray-600">增强图像边缘，提高3D立体感</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDepth3DSettingChange('edgeEnhancement', !depth3DSettings.edgeEnhancement)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    depth3DSettings.edgeEnhancement ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      depth3DSettings.edgeEnhancement ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3D图片上传区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">上传3D图片</h3>
          <div className="flex items-center space-x-2 text-sm text-purple-600">
            <ImageIcon className="w-4 h-4" />
            <span>支持立体效果</span>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-purple-500 bg-purple-50'
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
                  alt="3D预览图片"
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <Upload size={48} className="text-purple-400" />
                    <ImageIcon size={32} className="text-purple-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isProcessing ? '正在生成3D效果...' :
                   isDragActive ? '放开鼠标上传图片' :
                   '点击或拖拽图片到此处'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  支持 JPG、PNG、GIF、WebP 格式，最大 15MB<br />
                  系统将自动生成3D深度效果和立体钩织图解
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D功能提示 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          3D功能说明
        </h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• <strong>自动深度生成：</strong>基于图像颜色和边缘信息生成立体深度</li>
          <li>• <strong>多层钩织：</strong>将图片分解为多个深度层，支持立体钩织</li>
          <li>• <strong>智能分层：</strong>根据图像复杂度自动调整分层数量和质量</li>
          <li>• <strong>3D可视化：</strong>提供深度图预览和3D效果展示</li>
          <li>• <strong>立体钩织指令：</strong>生成包含深度信息的立体钩织步骤</li>
        </ul>
      </div>
    </div>
  );
};
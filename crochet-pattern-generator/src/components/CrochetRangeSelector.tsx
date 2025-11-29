import React, { useState } from 'react';
import { Settings, Circle, Square, Hexagon, RotateCw, Move } from 'lucide-react';
import { PatternSettings } from '../types';

interface CrochetRangeSelectorProps {
  settings: PatternSettings;
  onSettingsChange: (settings: PatternSettings) => void;
  className?: string;
}

export const CrochetRangeSelector: React.FC<CrochetRangeSelectorProps> = ({
  settings,
  onSettingsChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { crochetRange } = settings;

  const updateRange = (updates: Partial<typeof crochetRange>) => {
    onSettingsChange({
      ...settings,
      crochetRange: {
        ...crochetRange,
        ...updates
      }
    });
  };

  const handleRangeTypeChange = (type: typeof crochetRange.type) => {
    const newRange = { ...crochetRange, type };

    // 根据类型自动设置其他参数
    if (type === 'circular') {
      newRange.shape = 'circle';
      newRange.direction = 'rounds';
      newRange.startMethod = 'magic-ring';
      newRange.width = settings.width;
      newRange.height = settings.height;
      newRange.radius = Math.min(settings.width, settings.height) / 2;
      newRange.centerX = settings.width / 2;
      newRange.centerY = settings.height / 2;
    } else if (type === 'full') {
      newRange.shape = 'rectangle';
      newRange.direction = 'rows';
      newRange.startMethod = 'chain';
      newRange.width = settings.width;
      newRange.height = settings.height;
    }

    updateRange(newRange);
  };

  const handleShapeChange = (shape: typeof crochetRange.shape) => {
    const newRange = { ...crochetRange, shape };

    if (shape === 'circle') {
      newRange.direction = 'rounds';
      newRange.startMethod = 'magic-ring';
    } else if (shape === 'rectangle') {
      newRange.direction = 'rows';
      newRange.startMethod = 'chain';
    }

    updateRange(newRange);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600" />
          钩织范围设置
        </h3>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showAdvanced ? '简化设置' : '高级设置'}
        </button>
      </div>

      {/* 基础设置 */}
      <div className="space-y-6">
        {/* 钩织范围类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            钩织范围类型
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleRangeTypeChange('full')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                crochetRange.type === 'full'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Square className="w-6 h-6 mb-2 text-gray-600" />
              <div className="font-medium">完整图片</div>
              <div className="text-sm text-gray-500">钩织整个图片区域</div>
            </button>

            <button
              onClick={() => handleRangeTypeChange('custom')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                crochetRange.type === 'custom'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Move className="w-6 h-6 mb-2 text-gray-600" />
              <div className="font-medium">自定义范围</div>
              <div className="text-sm text-gray-500">选择特定区域</div>
            </button>

            <button
              onClick={() => handleRangeTypeChange('circular')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                crochetRange.type === 'circular'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Circle className="w-6 h-6 mb-2 text-gray-600" />
              <div className="font-medium">圆形范围</div>
              <div className="text-sm text-gray-500">适合圆形/花朵图案</div>
            </button>
          </div>
        </div>

        {showAdvanced && crochetRange.type !== 'full' && (
          <div className="space-y-6 border-t pt-6">
            {/* 形状选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                范围形状
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleShapeChange('rectangle')}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.shape === 'rectangle'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  矩形
                </button>
                <button
                  onClick={() => handleShapeChange('circle')}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.shape === 'circle'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  圆形
                </button>
                <button
                  onClick={() => handleShapeChange('ellipse')}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.shape === 'ellipse'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  椭圆形
                </button>
              </div>
            </div>

            {/* 起针方法 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                起针方法
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => updateRange({ startMethod: 'chain' })}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.startMethod === 'chain'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  锁链起针
                </button>
                <button
                  onClick={() => updateRange({ startMethod: 'magic-ring' })}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.startMethod === 'magic-ring'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  环形起针
                </button>
              </div>
            </div>

            {/* 钩织方向 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                钩织方向
              </label>
              <div className="flex space-x-3">
                <button
                  onClick={() => updateRange({ direction: 'rows' })}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.direction === 'rows'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  行钩织
                </button>
                <button
                  onClick={() => updateRange({ direction: 'rounds' })}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    crochetRange.direction === 'rounds'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  圈钩织
                </button>
              </div>
            </div>

            {/* 尺寸参数 */}
            {crochetRange.type === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    范围宽度
                  </label>
                  <input
                    type="number"
                    min="10"
                    max={settings.width}
                    value={crochetRange.width || settings.width}
                    onChange={(e) => updateRange({ width: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    范围高度
                  </label>
                  <input
                    type="number"
                    min="10"
                    max={settings.height}
                    value={crochetRange.height || settings.height}
                    onChange={(e) => updateRange({ height: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {crochetRange.shape === 'circle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  圆形半径
                </label>
                <input
                  type="number"
                  min="5"
                  max={Math.min(settings.width, settings.height) / 2}
                  value={crochetRange.radius || Math.min(settings.width, settings.height) / 2}
                  onChange={(e) => updateRange({ radius: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* 钩织说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <RotateCw className="w-4 h-4 mr-2" />
            钩织建议
          </h4>
          <div className="text-sm text-blue-800 space-y-1">
            {crochetRange.type === 'circular' && (
              <>
                <p>• <strong>环形起针</strong>：适合圆形图案，从中心向外钩织</p>
                <p>• <strong>圈钩织</strong>：每圈连续钩织，通过加针控制大小</p>
                <p>• <strong>适合图案</strong>：花朵、圆形饰品、杯垫等</p>
              </>
            )}
            {crochetRange.type === 'custom' && (
              <>
                <p>• <strong>选择性钩织</strong>：只钩织图案的特定部分</p>
                <p>• <strong>节省线材</strong>：避免空白区域的无效钩织</p>
                <p>• <strong>灵活组合</strong>：可以将多个部分分别钩织后拼接</p>
              </>
            )}
            {crochetRange.type === 'full' && (
              <>
                <p>• <strong>完整钩织</strong>：按照原图完整尺寸钩织</p>
                <p>• <strong>传统方式</strong>：使用行钩织或圈钩织的传统方法</p>
                <p>• <strong>适合各种图案</strong>：方形、矩形等常规图案</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
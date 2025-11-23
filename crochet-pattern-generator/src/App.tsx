import React, { useState, useRef } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { PatternGrid, PatternLegend, PatternStats } from './components/PatternGrid';
import { CrochetInstructions } from './components/CrochetInstructions';
import { ExportPanel } from './components/ExportPanel';
import { imageProcessor } from './utils/imageProcessor';
import { crochetGenerator } from './utils/crochetGenerator';
import { CrochetPattern, PatternSettings, ColorCell, YarnColor } from './types';

const defaultSettings: PatternSettings = {
  width: 50,
  height: 50,
  stitchesPerRow: 20,
  maxColors: 8,
  colorSimplification: 0.3,
  stitchType: 'single',
  removeBlackLines: true, // 默认开启黑色线条移除
  gauge: {
    stitchesPerInch: 4,
    rowsPerInch: 4
  }
};

function App() {
  const [settings, setSettings] = useState<PatternSettings>(defaultSettings);
  const [pattern, setPattern] = useState<CrochetPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'instructions' | 'export'>('grid');
  const [showGrid, setShowGrid] = useState(true);

  const patternRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, newSettings: PatternSettings) => {
    setIsGenerating(true);
    try {
      // 处理图片
      const imageResult = await imageProcessor.processImage(file, newSettings);

      // 创建颜色网格
      let colorGrid = imageProcessor.createColorGrid(
        imageResult.pixelatedData,
        imageResult.extractedColors,
        newSettings.width,
        newSettings.height
      );

      // 应用颜色简化
      if (newSettings.colorSimplification > 0) {
        colorGrid = imageProcessor.simplifyColorGrid(
          colorGrid,
          imageResult.extractedColors,
          newSettings.colorSimplification
        );
      }

      // 转换为ColorCell格式
      const grid: ColorCell[][] = colorGrid.map((row, y) =>
        row.map((color, x) => ({
          x,
          y,
          color,
          stitchType: newSettings.stitchType
        }))
      );

      // 生成编织说明
      const instructions = crochetGenerator.generateInstructions(
        colorGrid,
        newSettings.stitchType,
        newSettings.stitchesPerRow
      );

      // 重新提取简化后的颜色
      const uniqueColors = Array.from(new Set(
        colorGrid.flat().map(color => color.id)
      )).map(id => {
        return imageResult.extractedColors.find(c => c.id === id) || imageResult.extractedColors[0];
      });

      // 创建图解对象
      const newPattern: CrochetPattern = {
        id: Date.now().toString(),
        name: file.name.split('.')[0] || '钩针图解',
        width: newSettings.width,
        height: newSettings.height,
        stitchesPerRow: newSettings.stitchesPerRow,
        colors: uniqueColors,
        grid,
        instructions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setPattern(newPattern);
      setActiveTab('grid');
    } catch (error) {
      console.error('生成图解失败:', error);
      alert('生成图解失败，请重试！');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetPattern = () => {
    setPattern(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <span className="text-white font-bold text-lg">🧶</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                钩针图解生成器
              </h1>
            </div>

            {pattern && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={resetPattern}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  重新开始
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!pattern ? (
          /* 上传和设置页面 */
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                将您的图片转换为钩针图解
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                上传一张图片，自动生成钩针编织图解，包含详细的编织说明和颜色图例。
                支持自定义尺寸、颜色数量和针法类型。
              </p>
            </div>

            <ImageUpload
              onImageUpload={handleImageUpload}
              settings={settings}
              onSettingsChange={setSettings}
            />

            {isGenerating && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      正在生成图解
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                      请稍候，正在处理图片并生成编织说明...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 图解显示页面 */
          <div className="space-y-6">
            {/* 标签页导航 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'grid'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  图解网格
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'instructions'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  编织说明
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'export'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  导出分享
                </button>
              </div>

              <div className="p-6">
                {/* 图解信息 */}
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {pattern.name}
                  </h2>
                  <p className="text-gray-600">
                    创建于 {new Date(pattern.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                {/* 标签页内容 */}
                {activeTab === 'grid' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* 图解网格 */}
                      <div className="lg:col-span-3">
                        <div ref={patternRef} className="bg-white rounded-lg">
                          <PatternGrid pattern={pattern} cellSize={12} showGrid={showGrid} />
                        </div>
                      </div>

                      {/* 侧边栏信息 */}
                      <div className="space-y-6">
                        <PatternStats
  pattern={pattern}
  showGrid={showGrid}
  onToggleGrid={setShowGrid}
/>
                        <PatternLegend colors={pattern.colors} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'instructions' && (
                  <CrochetInstructions
                    instructions={pattern.instructions}
                    colors={pattern.colors}
                    patternName={pattern.name}
                  />
                )}

                {activeTab === 'export' && (
                  <ExportPanel
                    pattern={pattern}
                    patternElement={patternRef}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              🧶 钩针图解生成器 - 让编织更简单
            </p>
            <p className="text-sm">
              支持多种图片格式 | 自动颜色提取 | 详细编织说明
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
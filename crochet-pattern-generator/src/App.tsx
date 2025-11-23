import { useState, useRef } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { PatternGrid, PatternLegend, PatternStats } from './components/PatternGrid';
import { CrochetInstructions } from './components/CrochetInstructions';
import { CrochetStepGenerator } from './components/CrochetStepGenerator';
import { IrregularShapeInstructions } from './components/IrregularShapeInstructions';
import { ExportPanel } from './components/ExportPanel';
import { imageProcessor } from './utils/imageProcessor';
import { crochetGenerator } from './utils/crochetGenerator';
import { CrochetPattern, PatternSettings, ColorCell, YarnColor } from './types';

const defaultSettings: PatternSettings = {
  width: 50,
  height: 50,
  stitchesPerRow: 20, // 这个值将被动态计算覆盖
  maxColors: 8,
  colorSimplification: 0.3,
  stitchType: 'single',
  removeBlackLines: true, // 默认开启黑色线条移除
  // 新增钩织设置
  autoStitchPattern: true,  // 启用智能针法选择
  mixedStitches: true,      // 启用混合针法
  difficulty: 'easy',       // 使用简单模式
  showSymbols: true,        // 默认显示符号
  showColorChangeMarkers: true, // 默认显示换线标记
  gauge: {
    stitchesPerInch: 4,
    rowsPerInch: 4
  }
};

function App() {
  const [settings, setSettings] = useState<PatternSettings>(defaultSettings);
  const [pattern, setPattern] = useState<CrochetPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'instructions' | 'steps' | 'irregular' | 'export'>('grid');
  const [imageAnalysisResult, setImageAnalysisResult] = useState<any>(null);
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

      // 分析形状特征并生成智能针法推荐
      const shapeAnalysis = analyzeShapeForStitches(colorGrid);

      // 动态计算每行的实际针数（基于实际有效像素）
      const dynamicStitchesPerRow = calculateDynamicStitchesPerRow(colorGrid);

      // 创建优化的颜色网格（去除空白边缘）
      const optimizedGrid = optimizeGridForIrregularShape(colorGrid);

      // 使用分析出的推荐针法更新设置
      const optimizedSettings = {
        ...newSettings,
        stitchesPerRow: dynamicStitchesPerRow,
        difficulty: shapeAnalysis.difficulty,
        // 如果启用了自动针法选择，使用第一个推荐针法作为主要针法
        stitchType: newSettings.autoStitchPattern && shapeAnalysis.recommendedStitches.length > 0
          ? shapeAnalysis.recommendedStitches[0] as any
          : newSettings.stitchType
      };

      // 转换为ColorCell格式，根据形状类型智能分配针法
      const grid: ColorCell[][] = optimizedGrid.map((row, y) =>
        row.map((color, x) => ({
          x,
          y,
          color,
          stitchType: newSettings.mixedStitches
            ? getOptimalStitchForPosition(optimizedGrid, x, y, shapeAnalysis)
            : optimizedSettings.stitchType
        }))
      );

      // 生成增强的编织说明
      const instructions = crochetGenerator.generateInstructions(
        optimizedGrid,
        optimizedSettings
      );

      // 创建图解对象
      const newPattern: CrochetPattern = {
        id: Date.now().toString(),
        name: file.name.split('.')[0] || '钩针图解',
        width: optimizedGrid[0]?.length || newSettings.width,
        height: optimizedGrid.length,
        stitchesPerRow: dynamicStitchesPerRow,
        colors: imageResult.extractedColors,
        grid,
        instructions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setPattern(newPattern);
      setImageAnalysisResult(imageResult.analysisResult);
      setActiveTab('grid');
    } catch (error) {
      console.error('生成图解失败:', error);
      alert('生成图解失败，请重试！');
    } finally {
      setIsGenerating(false);
    }
  };

  // 动态计算每行针数并分析形状特征
  const calculateDynamicStitchesPerRow = (colorGrid: YarnColor[][]): number => {
    if (colorGrid.length === 0) return 20;

    let maxStitches = 0;
    const backgroundColor = { r: 255, g: 255, b: 255 }; // 假设白色为背景

    for (let y = 0; y < colorGrid.length; y++) {
      let rowStitches = 0;
      for (let x = 0; x < colorGrid[y].length; x++) {
        const color = colorGrid[y][x];
        // 计算与背景色的差异
        const diff = Math.sqrt(
          Math.pow(color.rgb.r - backgroundColor.r, 2) +
          Math.pow(color.rgb.g - backgroundColor.g, 2) +
          Math.pow(color.rgb.b - backgroundColor.b, 2)
        );

        // 如果不是背景色，则计为一针
        if (diff > 30) {
          rowStitches++;
        }
      }
      maxStitches = Math.max(maxStitches, rowStitches);
    }

    // 确保针数在合理范围内
    return Math.max(5, Math.min(50, Math.round(maxStitches * 1.1))); // 留10%余量
  };

  // 分析形状并生成智能针法推荐
  const analyzeShapeForStitches = (colorGrid: YarnColor[][]): {
    shapeType: 'simple' | 'organic' | 'geometric' | 'complex';
    recommendedStitches: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  } => {
    const backgroundColor = { r: 255, g: 255, b: 255 };
    let edgePixels = 0;
    let totalPixels = 0;
    let colorChanges = 0;
    let hollowAreas = 0;

    for (let y = 0; y < colorGrid.length; y++) {
      for (let x = 0; x < colorGrid[y].length; x++) {
        const color = colorGrid[y][x];
        const diff = Math.sqrt(
          Math.pow(color.rgb.r - backgroundColor.r, 2) +
          Math.pow(color.rgb.g - backgroundColor.g, 2) +
          Math.pow(color.rgb.b - backgroundColor.b, 2)
        );

        if (diff > 30) {
          totalPixels++;

          // 检查是否为边缘
          const isEdge =
            (x > 0 && Math.sqrt(
              Math.pow(colorGrid[y][x-1].rgb.r - backgroundColor.r, 2) +
              Math.pow(colorGrid[y][x-1].rgb.g - backgroundColor.g, 2) +
              Math.pow(colorGrid[y][x-1].rgb.b - backgroundColor.b, 2)
            ) <= 30) ||
            (x < colorGrid[y].length - 1 && Math.sqrt(
              Math.pow(colorGrid[y][x+1].rgb.r - backgroundColor.r, 2) +
              Math.pow(colorGrid[y][x+1].rgb.g - backgroundColor.g, 2) +
              Math.pow(colorGrid[y][x+1].rgb.b - backgroundColor.b, 2)
            ) <= 30) ||
            (y > 0 && Math.sqrt(
              Math.pow(colorGrid[y-1][x].rgb.r - backgroundColor.r, 2) +
              Math.pow(colorGrid[y-1][x].rgb.g - backgroundColor.g, 2) +
              Math.pow(colorGrid[y-1][x].rgb.b - backgroundColor.b, 2)
            ) <= 30) ||
            (y < colorGrid.length - 1 && Math.sqrt(
              Math.pow(colorGrid[y+1][x].rgb.r - backgroundColor.r, 2) +
              Math.pow(colorGrid[y+1][x].rgb.g - backgroundColor.g, 2) +
              Math.pow(colorGrid[y+1][x].rgb.b - backgroundColor.b, 2)
            ) <= 30);

          if (isEdge) edgePixels++;

          // 检测颜色变化
          if (x > 0) {
            const prevColorDiff = Math.sqrt(
              Math.pow(color.rgb.r - colorGrid[y][x-1].rgb.r, 2) +
              Math.pow(color.rgb.g - colorGrid[y][x-1].rgb.g, 2) +
              Math.pow(color.rgb.b - colorGrid[y][x-1].rgb.b, 2)
            );
            if (prevColorDiff > 50) colorChanges++;
          }
        } else if (y > 0 && y < colorGrid.length - 1 && x > 0 && x < colorGrid[y].length - 1) {
          // 检测空心区域
          const neighbors = [
            colorGrid[y-1][x], colorGrid[y+1][x],
            colorGrid[y][x-1], colorGrid[y][x+1]
          ];
          const hasNonEmptyNeighbor = neighbors.some(neighbor =>
            Math.sqrt(
              Math.pow(neighbor.rgb.r - backgroundColor.r, 2) +
              Math.pow(neighbor.rgb.g - backgroundColor.g, 2) +
              Math.pow(neighbor.rgb.b - backgroundColor.b, 2)
            ) > 30
          );
          if (hasNonEmptyNeighbor) hollowAreas++;
        }
      }
    }

    const edgeRatio = edgePixels / totalPixels;
    const colorChangeRatio = colorChanges / totalPixels;
    const hollowRatio = hollowAreas / (colorGrid.length * colorGrid[0].length);

    // 判断形状类型
    let shapeType: 'simple' | 'organic' | 'geometric' | 'complex';
    if (edgeRatio > 0.4 || hollowRatio > 0.1) {
      shapeType = 'organic';
    } else if (edgeRatio > 0.2 || colorChangeRatio > 0.3) {
      shapeType = 'complex';
    } else if (hollowRatio > 0.05) {
      shapeType = 'geometric';
    } else {
      shapeType = 'simple';
    }

    // 推荐针法
    const recommendedStitches: string[] = ['single']; // 基础针法

    if (shapeType === 'organic') {
      recommendedStitches.push('double', 'increase', 'decrease');
    } else if (shapeType === 'geometric') {
      recommendedStitches.push('half-double', 'slip', 'chain');
    } else if (shapeType === 'complex') {
      recommendedStitches.push('double', 'shell', 'bobble');
    }

    // 根据颜色变化添加更多针法
    if (colorChangeRatio > 0.2) {
      recommendedStitches.push('front-post', 'back-post');
    }

    // 确定难度
    const complexityScore = edgeRatio + colorChangeRatio + hollowRatio;
    let difficulty: 'easy' | 'medium' | 'hard';
    if (complexityScore < 0.2) {
      difficulty = 'easy';
    } else if (complexityScore < 0.5) {
      difficulty = 'medium';
    } else {
      difficulty = 'hard';
    }

    return {
      shapeType,
      recommendedStitches: [...new Set(recommendedStitches)], // 去重
      difficulty
    };
  };

  // 优化网格，去除空白边缘
  const optimizeGridForIrregularShape = (colorGrid: YarnColor[][]): YarnColor[][] => {
    if (colorGrid.length === 0) return [];

    const backgroundColor = { r: 255, g: 255, b: 255 };
    let minX = colorGrid[0].length, maxX = 0, minY = colorGrid.length, maxY = 0;

    // 找到有效区域的边界
    for (let y = 0; y < colorGrid.length; y++) {
      for (let x = 0; x < colorGrid[y].length; x++) {
        const color = colorGrid[y][x];
        const diff = Math.sqrt(
          Math.pow(color.rgb.r - backgroundColor.r, 2) +
          Math.pow(color.rgb.g - backgroundColor.g, 2) +
          Math.pow(color.rgb.b - backgroundColor.b, 2)
        );

        if (diff > 30) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // 如果没有有效区域，返回原始网格
    if (minX > maxX || minY > maxY) {
      return colorGrid;
    }

    // 裁剪到有效区域，并添加一些边距
    const padding = 2;
    minX = Math.max(0, minX - padding);
    maxX = Math.min(colorGrid[0].length - 1, maxX + padding);
    minY = Math.max(0, minY - padding);
    maxY = Math.min(colorGrid.length - 1, maxY + padding);

    const optimizedGrid: YarnColor[][] = [];
    for (let y = minY; y <= maxY; y++) {
      const row: YarnColor[] = [];
      for (let x = minX; x <= maxX; x++) {
        row.push(colorGrid[y][x]);
      }
      optimizedGrid.push(row);
    }

    return optimizedGrid;
  };

  // 根据位置和形状分析为每个位置选择最优针法
  const getOptimalStitchForPosition = (
    grid: YarnColor[][],
    x: number,
    y: number,
    shapeAnalysis: any
  ): any => {
    const backgroundColor = { r: 255, g: 255, b: 255 };
    const currentColor = grid[y][x];
    const isBackground = Math.sqrt(
      Math.pow(currentColor.rgb.r - backgroundColor.r, 2) +
      Math.pow(currentColor.rgb.g - backgroundColor.g, 2) +
      Math.pow(currentColor.rgb.b - backgroundColor.b, 2)
    ) <= 30;

    if (isBackground) return 'single';

    // 检查是否为边缘
    const isEdge = (x === 0 || x === grid[0].length - 1 || y === 0 || y === grid.length - 1) ||
      (x > 0 && Math.sqrt(
        Math.pow(grid[y][x-1].rgb.r - backgroundColor.r, 2) +
        Math.pow(grid[y][x-1].rgb.g - backgroundColor.g, 2) +
        Math.pow(grid[y][x-1].rgb.b - backgroundColor.b, 2)
      ) <= 30) ||
      (x < grid[0].length - 1 && Math.sqrt(
        Math.pow(grid[y][x+1].rgb.r - backgroundColor.r, 2) +
        Math.pow(grid[y][x+1].rgb.g - backgroundColor.g, 2) +
        Math.pow(grid[y][x+1].rgb.b - backgroundColor.b, 2)
      ) <= 30) ||
      (y > 0 && Math.sqrt(
        Math.pow(grid[y-1][x].rgb.r - backgroundColor.r, 2) +
        Math.pow(grid[y-1][x].rgb.g - backgroundColor.g, 2) +
        Math.pow(grid[y-1][x].rgb.b - backgroundColor.b, 2)
      ) <= 30) ||
      (y < grid.length - 1 && Math.sqrt(
        Math.pow(grid[y+1][x].rgb.r - backgroundColor.r, 2) +
        Math.pow(grid[y+1][x].rgb.g - backgroundColor.g, 2) +
        Math.pow(grid[y+1][x].rgb.b - backgroundColor.b, 2)
      ) <= 30);

    const { shapeType, recommendedStitches } = shapeAnalysis;

    // 根据形状类型和位置特征选择针法
    if (shapeType === 'organic') {
      if (isEdge) {
        return Math.random() > 0.5 ? 'increase' : 'decrease'; // 边缘用增减针
      }
      return Math.random() > 0.7 ? 'double' : 'single'; // 内部主要用长针
    } else if (shapeType === 'geometric') {
      if (isEdge) {
        return 'slip'; // 几何边缘用引拔针
      }
      return Math.random() > 0.6 ? 'half-double' : 'single'; // 中等密度用中长针
    } else if (shapeType === 'complex') {
      if (isEdge) {
        return recommendedStitches.includes('shell') ? 'shell' : 'single';
      }
      // 根据位置的复杂性选择装饰针法
      const complexity = (x + y) % (grid[0].length + grid.length);
      if (complexity % 7 === 0 && recommendedStitches.includes('bobble')) {
        return 'bobble';
      }
      return Math.random() > 0.8 ? 'double' : 'single';
    } else {
      // simple shape - 主要用基础针法
      return 'single';
    }
  };

  const resetPattern = () => {
    setPattern(null);
    setImageAnalysisResult(null);
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
                  onClick={() => setActiveTab('steps')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'steps'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  详细步骤
                </button>
                <button
                  onClick={() => setActiveTab('irregular')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${
                    activeTab === 'irregular'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  不规则图形
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

                {activeTab === 'steps' && (
                  <CrochetStepGenerator pattern={pattern} />
                )}

                {activeTab === 'irregular' && (
                  <IrregularShapeInstructions
                    pattern={pattern}
                    imageAnalysisResult={imageAnalysisResult}
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
import React, { useEffect, useRef, useState } from 'react';
import { Image3DResult, ImageLayer } from '../types';

interface Image3DPreviewProps {
  image3DResult: Image3DResult;
  className?: string;
}

export const Image3DPreview: React.FC<Image3DPreviewProps> = ({
  image3DResult,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [showDepth, setShowDepth] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);

  const { originalImage, depthMap, layers, width, height } = image3DResult;

  useEffect(() => {
    if (autoRotate) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 2) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [autoRotate]);

  useEffect(() => {
    if (canvasRef.current && depthCanvasRef.current) {
      renderImage();
    }
  }, [image3DResult, selectedLayer, showDepth, showLayers, rotation]);

  const renderImage = () => {
    const canvas = canvasRef.current!;
    const depthCanvas = depthCanvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const depthCtx = depthCanvas.getContext('2d')!;

    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    depthCanvas.width = width;
    depthCanvas.height = height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);
    depthCtx.clearRect(0, 0, width, height);

    // 渲染深度图
    depthCtx.putImageData(depthMap, 0, 0);

    // 渲染主图像
    if (showDepth) {
      // 显示深度图
      ctx.putImageData(depthMap, 0, 0);
    } else {
      // 绘制原图
      ctx.drawImage(originalImage, 0, 0, width, height);
    }

    // 渲染层级
    if (showLayers && !showDepth) {
      renderLayers(ctx);
    }

    // 渲染选中层级的高亮
    if (selectedLayer !== null && !showDepth) {
      highlightSelectedLayer(ctx, selectedLayer);
    }

    // 应用3D效果
    if (!showDepth) {
      apply3DEffect(ctx);
    }
  };

  const renderLayers = (ctx: CanvasRenderingContext2D) => {
    layers.forEach((layer, index) => {
      if (layer.prominence > 0.1) { // 只显示有显著内容的层
        ctx.globalAlpha = 0.3 + (layer.prominence * 0.7);
        ctx.putImageData(layer.imageData, 0, 0);
      }
    });
    ctx.globalAlpha = 1.0;
  };

  const highlightSelectedLayer = (ctx: CanvasRenderingContext2D, layerIndex: number) => {
    const layer = layers[layerIndex];
    if (!layer) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.putImageData(layer.imageData, 0, 0);

    // 添加层级标识
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, 40, 25);

    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`层 ${layer.depth}`, 10, 22);

    ctx.globalCompositeOperation = 'source-over';
  };

  const apply3DEffect = (ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // 应用轻微的3D阴影效果
        if (x > 0 && y > 0) {
          const shadowIntensity = 0.1;
          const leftIdx = (y * width + x - 1) * 4;
          const topIdx = ((y - 1) * width + x) * 4;

          if (data[leftIdx + 3] < data[idx + 3]) {
            data[idx] *= (1 - shadowIntensity);
            data[idx + 1] *= (1 - shadowIntensity);
            data[idx + 2] *= (1 - shadowIntensity);
          }

          if (data[topIdx + 3] < data[idx + 3]) {
            data[idx] *= (1 - shadowIntensity * 0.7);
            data[idx + 1] *= (1 - shadowIntensity * 0.7);
            data[idx + 2] *= (1 - shadowIntensity * 0.7);
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleLayerSelect = (layerIndex: number) => {
    setSelectedLayer(selectedLayer === layerIndex ? null : layerIndex);
  };

  const export3DVisualization = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = '3d-crochet-visualization.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3D预览控制</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <button
            onClick={() => setShowDepth(!showDepth)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showDepth
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDepth ? '显示原图' : '显示深度'}
          </button>

          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showLayers
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showLayers ? '隐藏分层' : '显示分层'}
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              autoRotate
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {autoRotate ? '停止旋转' : '自动旋转'}
          </button>

          <button
            onClick={export3DVisualization}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            导出图片
          </button>
        </div>

        {/* 旋转控制 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3D视角旋转: {rotation}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="w-full"
            disabled={autoRotate}
          />
        </div>
      </div>

      {/* 主预览区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {showDepth ? '深度图预览' : '3D效果预览'}
        </h3>

        <div className="flex justify-center items-center space-x-6">
          {/* 主图像 */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded-lg shadow-sm"
              style={{
                maxWidth: '100%',
                height: 'auto',
                transform: `perspective(1000px) rotateY(${rotation}deg) rotateX(${rotation * 0.2}deg)`
              }}
            />
            {selectedLayer !== null && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                层级 {layers[selectedLayer]?.depth} 高亮
              </div>
            )}
          </div>

          {/* 深度图 */}
          {!showDepth && (
            <div className="hidden md:block">
              <h4 className="text-sm font-medium text-gray-700 mb-2">深度图</h4>
              <canvas
                ref={depthCanvasRef}
                className="border border-gray-300 rounded-lg shadow-sm"
                style={{
                  maxWidth: '200px',
                  height: 'auto'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 层级选择器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">层级选择</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {layers
            .filter(layer => layer.prominence > 0.05) // 只显示有内容的层
            .sort((a, b) => b.depth - a.depth) // 按深度排序
            .map((layer, index) => {
              const actualIndex = layers.indexOf(layer);
              const isSelected = selectedLayer === actualIndex;

              return (
                <button
                  key={actualIndex}
                  onClick={() => handleLayerSelect(actualIndex)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded mb-2"
                    style={{
                      backgroundColor: layer.color.hexCode,
                      opacity: 0.8
                    }}
                  />
                  <div className="text-xs font-medium text-gray-900">
                    层 {layer.depth}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(layer.prominence * 100)}%
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-purple-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• 点击层级可单独高亮显示</p>
          <p>• 层级按深度排序，数值越大越靠前</p>
          <p>• 百分比表示该层在整体中的占比</p>
        </div>
      </div>

      {/* 3D统计信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">3D分析结果</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {layers.length}
            </div>
            <div className="text-sm text-gray-600">深度层数</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {layers.filter(l => l.prominence > 0.1).length}
            </div>
            <div className="text-sm text-gray-600">有效层级</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(layers.reduce((sum, l) => sum + l.prominence, 0) * 100)}%
            </div>
            <div className="text-sm text-gray-600">内容覆盖率</div>
          </div>
        </div>

        {/* 层级详情 */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">层级详情</h4>
          <div className="space-y-2">
            {layers
              .filter(layer => layer.prominence > 0.05)
              .sort((a, b) => b.depth - a.depth)
              .map((layer, index) => (
                <div
                  key={layers.indexOf(layer)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: layer.color.hexCode }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      层级 {layer.depth} - {layer.color.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(layer.prominence * 100)}% 占比
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
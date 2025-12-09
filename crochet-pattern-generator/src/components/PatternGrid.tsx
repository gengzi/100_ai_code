import React, { useRef, useEffect } from 'react';
import { YarnColor, CrochetPattern } from '../types';

interface PatternGridProps {
  pattern: CrochetPattern;
  cellSize?: number;
  showGrid?: boolean;
  showRowNumbers?: boolean;
  showStitchSymbols?: boolean;
  className?: string;
}

export const PatternGrid: React.FC<PatternGridProps> = ({
  pattern,
  cellSize = 15,
  showGrid = true,
  showRowNumbers = true,
  showStitchSymbols = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawPattern();
  }, [pattern, cellSize, showGrid, showRowNumbers, showStitchSymbols]);

  const drawPattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const padding = showRowNumbers ? 40 : 10;
    canvas.width = pattern.width * cellSize + padding * 2;
    canvas.height = pattern.height * cellSize + padding * 2;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格和颜色
    const offsetX = padding;
    const offsetY = padding;

    pattern.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        // 跳过透明像素
        if (cell.color === null) return;

        const xPos = offsetX + x * cellSize;
        const yPos = offsetY + y * cellSize;

        // 填充颜色
        ctx.fillStyle = cell.color.hexCode;
        ctx.fillRect(xPos, yPos, cellSize, cellSize);

        // 绘制针法符号
        if (showStitchSymbols && cell.stitchType !== null && cell.color !== null) {
          drawStitchSymbol(ctx, xPos, yPos, cellSize, cell.stitchType, cell.color);
        }
      });
    });

    // 绘制网格线
    if (showGrid) {
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;

      // 垂直线
      for (let x = 0; x <= pattern.width; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * cellSize, offsetY);
        ctx.lineTo(offsetX + x * cellSize, offsetY + pattern.height * cellSize);
        ctx.stroke();
      }

      // 水平线
      for (let y = 0; y <= pattern.height; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * cellSize);
        ctx.lineTo(offsetX + pattern.width * cellSize, offsetY + y * cellSize);
        ctx.stroke();
      }
    }

    // 绘制行号
    if (showRowNumbers) {
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      pattern.grid.forEach((_, y) => {
        const yPos = offsetY + y * cellSize + cellSize / 2;
        ctx.fillText(String(y + 1), offsetX - 10, yPos);
      });
    }
  };

  const drawStitchSymbol = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    stitchType: string,
    cellColor: YarnColor
  ) => {
    ctx.save();

    // 根据格子颜色亮度选择对比色
    const brightness = (cellColor.rgb.r + cellColor.rgb.g + cellColor.rgb.b) / 3;
    ctx.strokeStyle = brightness > 128 ? '#333333' : '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.translate(x + size / 2, y + size / 2);

    const symbolSize = size * 0.6;

    switch (stitchType) {
      case 'single':
        // 短针：绘制X
        ctx.beginPath();
        ctx.moveTo(-symbolSize / 2, -symbolSize / 2);
        ctx.lineTo(symbolSize / 2, symbolSize / 2);
        ctx.moveTo(symbolSize / 2, -symbolSize / 2);
        ctx.lineTo(-symbolSize / 2, symbolSize / 2);
        ctx.stroke();
        break;

      case 'double':
        // 长针：绘制V
        ctx.beginPath();
        ctx.moveTo(-symbolSize / 2, symbolSize / 2);
        ctx.lineTo(0, -symbolSize / 2);
        ctx.lineTo(symbolSize / 2, symbolSize / 2);
        ctx.stroke();
        break;

      case 'half-double':
        // 中长针：绘制T
        ctx.beginPath();
        ctx.moveTo(-symbolSize / 2, 0);
        ctx.lineTo(symbolSize / 2, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -symbolSize / 2);
        ctx.stroke();
        break;

      case 'treble':
        // 特长针：绘制十字
        ctx.beginPath();
        ctx.moveTo(-symbolSize / 2, 0);
        ctx.lineTo(symbolSize / 2, 0);
        ctx.moveTo(0, -symbolSize / 2);
        ctx.lineTo(0, symbolSize / 2);
        ctx.stroke();
        break;

      default:
        // 默认：点
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  return (
    <div className={`flex justify-center items-center p-4 ${className}`}>
      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded shadow-sm"
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
};

interface PatternLegendProps {
  colors: YarnColor[];
  className?: string;
}

export const PatternLegend: React.FC<PatternLegendProps> = ({
  colors,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">颜色图例</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {colors.map((color, index) => (
          <div key={color.id} className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded border-2 border-gray-300"
              style={{ backgroundColor: color.hexCode }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {index + 1}. {color.name}
              </div>
              <div className="text-xs text-gray-500">
                {color.hexCode}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PatternStatsProps {
  pattern: CrochetPattern;
  showGrid?: boolean;
  onToggleGrid?: (show: boolean) => void;
  className?: string;
}

export const PatternStats: React.FC<PatternStatsProps> = ({
  pattern,
  showGrid = false,
  onToggleGrid,
  className = ''
}) => {
  const totalStitches = pattern.width * pattern.height;
  const estimatedTime = Math.ceil(totalStitches / 25); // 假设每分钟25针

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">图解信息</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">图解尺寸:</span>
          <span className="text-sm font-medium text-gray-900">
            {pattern.width} × {pattern.height}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">每行针数:</span>
          <span className="text-sm font-medium text-gray-900">
            {pattern.stitchesPerRow} 针
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">总针数:</span>
          <span className="text-sm font-medium text-gray-900">
            {totalStitches.toLocaleString()} 针
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">使用颜色:</span>
          <span className="text-sm font-medium text-gray-900">
            {pattern.colors.length} 种
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">预计时间:</span>
          <span className="text-sm font-medium text-gray-900">
            约 {Math.ceil(estimatedTime / 60)} 小时 {estimatedTime % 60} 分钟
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">主要针法:</span>
          <span className="text-sm font-medium text-gray-900">
            {pattern.instructions[0]?.instructions.includes('X') ? '短针' :
             pattern.instructions[0]?.instructions.includes('V') ? '长针' :
             pattern.instructions[0]?.instructions.includes('H') ? '中长针' : '其他'}
          </span>
        </div>

        {/* 网格线切换 */}
        {onToggleGrid && (
          <div className="pt-3 border-t border-gray-200 mt-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-600">显示网格线</span>
              <button
                onClick={() => onToggleGrid(!showGrid)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showGrid ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showGrid ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { PatternSettings } from '../types';

interface CrochetRangePreviewProps {
  settings: PatternSettings;
  gridSize: number;
  className?: string;
}

export const CrochetRangePreview: React.FC<CrochetRangePreviewProps> = ({
  settings,
  gridSize,
  className = ''
}) => {
  const { width, height, crochetRange } = settings;

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    // 设置画布尺寸
    const canvasSize = Math.min(400, Math.max(200, width * gridSize / 2));
    const cellSize = canvasSize / Math.max(width, height);

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 绘制背景网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height * cellSize);
      ctx.stroke();
    }

    for (let i = 0; i <= height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width * cellSize, i * cellSize);
      ctx.stroke();
    }

    // 绘制图片边界
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width * cellSize, height * cellSize);

    // 绘制钩织范围
    if (crochetRange.type === 'full') {
      // 完整范围 - 用浅蓝色填充整个区域
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(0, 0, width * cellSize, height * cellSize);
    } else if (crochetRange.type === 'circular') {
      // 圆形范围
      const radius = (crochetRange.radius || Math.min(width, height) / 2) * cellSize;
      const centerX = (crochetRange.centerX || width / 2) * cellSize;
      const centerY = (crochetRange.centerY || height / 2) * cellSize;

      // 绘制圆形范围
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制圆形边界
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // 标记中心点
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();

    } else if (crochetRange.type === 'custom') {
      // 自定义范围
      const rangeWidth = (crochetRange.width || width) * cellSize;
      const rangeHeight = (crochetRange.height || height) * cellSize;
      const startX = ((width - (crochetRange.width || width)) / 2) * cellSize;
      const startY = ((height - (crochetRange.height || height)) / 2) * cellSize;

      if (crochetRange.shape === 'circle') {
        const radius = Math.min(rangeWidth, rangeHeight) / 2;
        const centerX = startX + rangeWidth / 2;
        const centerY = startY + rangeHeight / 2;

        ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (crochetRange.shape === 'ellipse') {
        const centerX = startX + rangeWidth / 2;
        const centerY = startY + rangeHeight / 2;

        ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rangeWidth / 2, rangeHeight / 2, 0, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rangeWidth / 2, rangeHeight / 2, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // 矩形范围
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(startX, startY, rangeWidth, rangeHeight);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, rangeWidth, rangeHeight);
      }
    }

    // 绘制钩织方向指示
    if (crochetRange.direction === 'rounds') {
      // 圈钩织 - 绘制螺旋箭头
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const centerX = width * cellSize / 2;
      const centerY = height * cellSize / 2;
      const spiralRadius = Math.min(width, height) * cellSize / 4;

      ctx.beginPath();
      for (let angle = 0; angle < 4 * Math.PI; angle += 0.1) {
        const r = spiralRadius * (1 + angle / (4 * Math.PI));
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 箭头
      const lastAngle = 4 * Math.PI - 0.1;
      const lastR = spiralRadius * (1 + lastAngle / (4 * Math.PI));
      const lastX = centerX + lastR * Math.cos(lastAngle);
      const lastY = centerY + lastR * Math.sin(lastAngle);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(lastX - 5, lastY + 3);
      ctx.lineTo(lastX - 5, lastY - 3);
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawIcon = (ctx: CanvasRenderingContext2D, size: number) => {
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.clearRect(0, 0, size, size);

    if (crochetRange.direction === 'rounds') {
      // 圈钩织图标
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 3, 0, 2 * Math.PI);
      ctx.stroke();

      // 螺旋
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      for (let angle = 0; angle < 6 * Math.PI; angle += 0.2) {
        const r = size / 6 * (1 + angle / (6 * Math.PI));
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // 行钩织图标
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;

      for (let i = 0; i < 4; i++) {
        const y = centerY - 12 + i * 8;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, y);
        ctx.lineTo(centerX + 15, y);
        ctx.stroke();
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h4 className="text-lg font-medium text-gray-900 mb-4">钩织范围预览</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 网格预览 */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">网格预览</h5>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={(canvas) => {
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    const size = Math.min(400, Math.max(200, width * gridSize / 2));
                    canvas.width = size;
                    canvas.height = size;
                    drawGrid(ctx);
                  }
                }
              }}
              className="w-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* 钩织方向图标 */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">钩织方向</h5>
          <div className="flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 p-8">
            <canvas
              ref={(canvas) => {
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = 60;
                    canvas.height = 60;
                    drawIcon(ctx, 60);
                  }
                }
              }}
              width={60}
              height={60}
              className="border-2 border-white rounded-full shadow-sm"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <div className="text-center mt-4">
            <div className="text-sm font-medium text-gray-900">
              {crochetRange.direction === 'rounds' ? '圈钩织' : '行钩织'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {crochetRange.direction === 'rounds'
                ? '从中心向外螺旋钩织'
                : '从左到右逐行钩织'
              }
            </div>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">
            {crochetRange.type === 'circular'
              ? Math.round(Math.PI * Math.pow((crochetRange.radius || Math.min(width, height) / 2), 2))
              : (crochetRange.width || width) * (crochetRange.height || height)
            }
          </div>
          <div className="text-xs text-gray-600">预计针数</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-600">
            {crochetRange.startMethod === 'magic-ring' ? '环形起针' : '锁链起针'}
          </div>
          <div className="text-xs text-gray-600">起针方法</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-600">
            {crochetRange.type === 'circular' ? '圆形' : (crochetRange.shape || '矩形')}
          </div>
          <div className="text-xs text-gray-600">形状类型</div>
        </div>
      </div>
    </div>
  );
};
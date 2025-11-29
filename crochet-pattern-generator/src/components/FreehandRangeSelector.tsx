import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Edit3, Eraser, Download, RotateCcw } from 'lucide-react';
import { PatternSettings } from '../types';

interface Point {
  x: number;
  y: number;
}

interface FreehandRange {
  path: Point[];
  isSelected: boolean;
}

interface FreehandRangeSelectorProps {
  settings: PatternSettings;
  onSettingsChange: (settings: PatternSettings) => void;
  imageGrid?: (any | null)[][];
  className?: string;
}

export const FreehandRangeSelector: React.FC<FreehandRangeSelectorProps> = ({
  settings,
  onSettingsChange,
  imageGrid,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [ranges, setRanges] = useState<FreehandRange[]>([]);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [gridSize, setGridSize] = useState(8);

  // 初始化画布
  useEffect(() => {
    if (!canvasRef.current || !imageGrid) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const cellSize = gridSize;
    canvas.width = settings.width * cellSize;
    canvas.height = settings.height * cellSize;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    drawGrid(ctx, cellSize);

    // 绘制颜色网格
    drawColorGrid(ctx, cellSize);

    // 绘制已选择的范围
    drawRanges(ctx, cellSize);

    // 绘制当前路径
    if (currentPath.length > 0) {
      drawPath(ctx, currentPath, cellSize, isDrawing ? 'rgba(59, 130, 246, 0.8)' : 'rgba(34, 197, 94, 0.8)');
    }
  }, [imageGrid, settings, currentPath, ranges, isDrawing, gridSize]);

  /**
   * 绘制网格
   */
  const drawGrid = (ctx: CanvasRenderingContext2D, cellSize: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= settings.width; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, settings.height * cellSize);
      ctx.stroke();
    }

    for (let i = 0; i <= settings.height; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(settings.width * cellSize, i * cellSize);
      ctx.stroke();
    }
  };

  /**
   * 绘制颜色网格
   */
  const drawColorGrid = (ctx: CanvasRenderingContext2D, cellSize: number) => {
    if (!imageGrid) return;

    for (let y = 0; y < settings.height && y < imageGrid.length; y++) {
      for (let x = 0; x < settings.width && x < imageGrid[y].length; x++) {
        const cell = imageGrid[y][x];
        if (cell && cell.hexCode) {
          ctx.fillStyle = cell.hexCode;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  /**
   * 绘制已选择的范围
   */
  const drawRanges = (ctx: CanvasRenderingContext2D, cellSize: number) => {
    ranges.forEach(range => {
      if (range.isSelected && range.path.length > 2) {
        // 填充选中区域
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.beginPath();
        ctx.moveTo(range.path[0].x * cellSize, range.path[0].y * cellSize);

        for (let i = 1; i < range.path.length; i++) {
          ctx.lineTo(range.path[i].x * cellSize, range.path[i].y * cellSize);
        }

        ctx.closePath();
        ctx.fill();

        // 绘制边界
        drawPath(ctx, range.path, cellSize, 'rgba(59, 130, 246, 1)');
      }
    });
  };

  /**
   * 绘制路径
   */
  const drawPath = (ctx: CanvasRenderingContext2D, path: Point[], cellSize: number, color: string) => {
    if (path.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(path[0].x * cellSize, path[0].y * cellSize);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize, path[i].y * cellSize);
    }

    ctx.stroke();

    // 绘制点
    ctx.fillStyle = color;
    path.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * cellSize, point.y * cellSize, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  /**
   * 获取鼠标在网格中的坐标
   */
  const getGridCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);

    if (x >= 0 && x < settings.width && y >= 0 && y < settings.height) {
      return { x, y };
    }

    return null;
  };

  /**
   * 处理鼠标按下
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getGridCoordinates(e);
    if (!point) return;

    setIsDrawing(true);

    if (tool === 'draw') {
      setCurrentPath([point]);
    } else if (tool === 'erase') {
      // 擦除：检查点击位置是否在某个范围内
      const updatedRanges = ranges.map(range => {
        if (isPointInPath(point, range.path)) {
          return { ...range, isSelected: false };
        }
        return range;
      }).filter(range => range.isSelected); // 移除未选中的范围

      setRanges(updatedRanges);
    }
  };

  /**
   * 处理鼠标移动
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'draw') return;

    const point = getGridCoordinates(e);
    if (!point) return;

    // 添加点（避免重复）
    setCurrentPath(prev => {
      const lastPoint = prev[prev.length - 1];
      if (!lastPoint || lastPoint.x !== point.x || lastPoint.y !== point.y) {
        return [...prev, point];
      }
      return prev;
    });
  };

  /**
   * 处理鼠标释放
   */
  const handleMouseUp = () => {
    if (!isDrawing || tool !== 'draw') return;

    setIsDrawing(false);

    if (currentPath.length > 2) {
      // 闭合路径
      const closedPath = [...currentPath, currentPath[0]];
      const newRange: FreehandRange = {
        path: closedPath,
        isSelected: true
      };

      setRanges(prev => [...prev, newRange]);
    }

    setCurrentPath([]);
  };

  /**
   * 检查点是否在路径内
   */
  const isPointInPath = (point: Point, path: Point[]): boolean => {
    if (path.length < 3) return false;

    let inside = false;
    for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
      const xi = path[i].x, yi = path[i].y;
      const xj = path[j].x, yj = path[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  /**
   * 清除所有选择
   */
  const clearAll = () => {
    setRanges([]);
    setCurrentPath([]);
  };

  /**
   * 撤销上一个选择
   */
  const undo = () => {
    setRanges(prev => prev.slice(0, -1));
  };

  /**
   * 应用选择到设置
   */
  const applySelection = () => {
    if (ranges.length === 0) return;

    // 将手绘范围转换为自定义钩织范围
    const boundingBox = calculateBoundingBox(ranges);

    onSettingsChange({
      ...settings,
      crochetRange: {
        type: 'custom',
        shape: 'rectangle', // 简化为矩形
        width: boundingBox.width,
        height: boundingBox.height,
        centerX: boundingBox.centerX,
        centerY: boundingBox.centerY,
        startMethod: 'chain',
        direction: 'rows'
      }
    });
  };

  /**
   * 计算所有范围的边界框
   */
  const calculateBoundingBox = (rangeList: FreehandRange[]) => {
    if (rangeList.length === 0) {
      return { width: settings.width, height: settings.height, centerX: settings.width / 2, centerY: settings.height / 2 };
    }

    let minX = settings.width, minY = settings.height;
    let maxX = 0, maxY = 0;

    rangeList.forEach(range => {
      range.path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const centerX = Math.round((minX + maxX) / 2);
    const centerY = Math.round((minY + maxY) / 2);

    return { width, height, centerX, centerY };
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-blue-600" />
          手绘选择钩织范围
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool(tool === 'draw' ? 'erase' : 'draw')}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              tool === 'draw'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-red-50 border-red-500 text-red-700'
            }`}
          >
            {tool === 'draw' ? '✏️ 绘制' : '🧹 擦除'}
          </button>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={ranges.length === 0}
            className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="撤销"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clearAll}
            disabled={ranges.length === 0}
            className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="清除全部"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">网格大小:</label>
            <input
              type="range"
              min="4"
              max="16"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{gridSize}px</span>
          </div>

          <button
            onClick={applySelection}
            disabled={ranges.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            应用选择
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>绘制模式</strong>：按住鼠标左键绘制闭合区域</li>
          <li>• <strong>擦除模式</strong>：点击选中区域将其删除</li>
          <li>• <strong>应用选择</strong>：将绘制区域转换为钩织范围</li>
          <li>• 绘制的区域会自动填充半透明蓝色</li>
        </ul>
      </div>

      {/* 画布容器 */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        {!imageGrid ? (
          <div className="flex items-center justify-center p-12 text-gray-500">
            <div className="text-center">
              <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>请先上传图片以开始绘制</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
      </div>

      {/* 统计信息 */}
      {ranges.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">{ranges.length}</div>
            <div className="text-xs text-gray-600">选中区域</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">
              {ranges.reduce((sum, range) => sum + range.path.length, 0)}
            </div>
            <div className="text-xs text-gray-600">绘制点数</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">
              {calculateBoundingBox(ranges).width} × {calculateBoundingBox(ranges).height}
            </div>
            <div className="text-xs text-gray-600">范围尺寸</div>
          </div>
        </div>
      )}
    </div>
  );
};
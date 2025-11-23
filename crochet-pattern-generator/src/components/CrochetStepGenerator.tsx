import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, Grid, List } from 'lucide-react';
import { CrochetPattern, YarnColor, ColorCell } from '../types';

interface DetailedStep {
  row: number;
  direction: 'right' | 'left'; // 编织方向
  stitches: StitchStep[];
  totalStitches: number;
  stitchCount: { [colorId: string]: number }; // 每种颜色的针数
}

interface StitchStep {
  position: number;
  color: YarnColor;
  insertPoint: string; // 入针点描述
  isColorChange: boolean; // 是否为换线点
  stitchSymbol: string; // 针法符号
}

interface CrochetStepGeneratorProps {
  pattern: CrochetPattern;
  className?: string;
}

export const CrochetStepGenerator: React.FC<CrochetStepGeneratorProps> = ({
  pattern,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showInsertPoints, setShowInsertPoints] = useState(true);
  const [showColorChanges, setShowColorChanges] = useState(true);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // 生成详细的钩织步骤
  const generateDetailedSteps = (): DetailedStep[] => {
    const steps: DetailedStep[] = [];

    for (let row = 0; row < pattern.height; row++) {
      const stitches: StitchStep[] = [];
      const stitchCount: { [colorId: string]: number } = {};
      let currentColor = pattern.grid[row][0]?.color;
      let isColorChange = false;

      // 分析每一行的针目
      for (let col = 0; col < pattern.width; col++) {
        const cell = pattern.grid[row][col];
        if (!cell) continue;

        // 检查是否换线
        isColorChange = cell.color.id !== currentColor.id;

        // 统计颜色针数
        stitchCount[cell.color.id] = (stitchCount[cell.color.id] || 0) + 1;

        // 生成入针点描述
        const insertPoint = generateInsertPointDescription(row, col, cell, isColorChange);

        stitches.push({
          position: col + 1,
          color: cell.color,
          insertPoint,
          isColorChange,
          stitchSymbol: '✕' // 短针符号
        });

        if (isColorChange) {
          currentColor = cell.color;
        }
      }

      // 确定编织方向（奇数行从右到左，偶数行从左到右）
      const direction = row % 2 === 0 ? 'right' : 'left';

      // 如果是反向编织，需要反转针目顺序
      if (direction === 'left') {
        stitches.reverse();
      }

      steps.push({
        row: row + 1,
        direction,
        stitches,
        totalStitches: stitches.length,
        stitchCount
      });
    }

    return steps;
  };

  // 生成入针点描述
  const generateInsertPointDescription = (
    _row: number,
    col: number,
    _cell: ColorCell,
    isColorChange: boolean
  ): string => {
    const baseDesc = `第${col + 1}针`;

    if (isColorChange && col > 0) {
      return `${baseDesc} (换线点)`;
    }

    if (col === 0) {
      return `${baseDesc} (起针)`;
    }

    return baseDesc;
  };

  // 绘制单行的钩织图解
  const drawRowDiagram = (canvas: HTMLCanvasElement, step: DetailedStep) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 30;
    const padding = 40;
    const canvasWidth = step.stitches.length * cellSize + padding * 2;
    const canvasHeight = cellSize + padding * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 清空画布
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制行号和方向
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `第${step.row}行 (${step.direction === 'right' ? '→' : '←'})`,
      canvasWidth / 2,
      20
    );

    // 绘制针目
    step.stitches.forEach((stitch, index) => {
      const x = padding + index * cellSize;
      const y = padding;

      // 绘制背景色块
      ctx.fillStyle = stitch.color.hexCode;
      ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

      // 绘制边框
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);

      // 绘制短针符号
      const brightness = (stitch.color.rgb.r + stitch.color.rgb.g + stitch.color.rgb.b) / 3;
      ctx.strokeStyle = brightness > 128 ? '#333333' : '#FFFFFF';
      ctx.lineWidth = 2;

      const centerX = x + cellSize / 2 - 1;
      const centerY = y + cellSize / 2 - 1;
      const symbolSize = cellSize * 0.4;

      ctx.beginPath();
      ctx.moveTo(centerX - symbolSize / 2, centerY - symbolSize / 2);
      ctx.lineTo(centerX + symbolSize / 2, centerY + symbolSize / 2);
      ctx.moveTo(centerX + symbolSize / 2, centerY - symbolSize / 2);
      ctx.lineTo(centerX - symbolSize / 2, centerY + symbolSize / 2);
      ctx.stroke();

      // 标记换线点
      if (showColorChanges && stitch.isColorChange) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + cellSize - 8, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 绘制位置编号
      if (showInsertPoints) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stitch.position.toString(), centerX, y + cellSize - 5);
      }
    });

    // 绘制颜色分段标记
    if (showColorChanges) {
      let currentColor = step.stitches[0]?.color;
      let segmentStart = 0;

      step.stitches.forEach((stitch, index) => {
        if (stitch.color.id !== currentColor.id) {
          // 绘制分段线
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(padding + index * cellSize - 1, padding - 10);
          ctx.lineTo(padding + index * cellSize - 1, padding + cellSize - 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // 绘制颜色标签
          ctx.fillStyle = '#374151';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          const segmentMiddle = padding + (segmentStart + index - 1) * cellSize / 2 + cellSize / 2 - 1;
          ctx.fillText(
            `${index - segmentStart}${currentColor.name}`,
            segmentMiddle,
            padding + cellSize + 15
          );

          currentColor = stitch.color;
          segmentStart = index;
        }
      });

      // 绘制最后一段
      if (segmentStart < step.stitches.length) {
        ctx.fillStyle = '#374151';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        const segmentMiddle = padding + (segmentStart + step.stitches.length - 1) * cellSize / 2 + cellSize / 2 - 1;
        ctx.fillText(
          `${step.stitches.length - segmentStart}${currentColor.name}`,
          segmentMiddle,
          padding + cellSize + 15
        );
      }
    }
  };

  const detailedSteps = generateDetailedSteps();

  useEffect(() => {
    // 绘制所有展开的行
    Object.keys(canvasRefs.current).forEach(rowStr => {
      const row = parseInt(rowStr);
      const canvas = canvasRefs.current[row];
      if (canvas && expandedRows.has(row)) {
        drawRowDiagram(canvas, detailedSteps[row - 1]);
      }
    });
  }, [expandedRows, showInsertPoints, showColorChanges, detailedSteps]);

  const toggleRowExpansion = (row: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(row)) {
      newExpanded.delete(row);
    } else {
      newExpanded.add(row);
    }
    setExpandedRows(newExpanded);
  };

  const expandAll = () => {
    setExpandedRows(new Set(detailedSteps.map(step => step.row)));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const downloadInstructions = () => {
    const content = generateTextInstructions();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pattern.name}_详细钩织步骤.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateTextInstructions = (): string => {
    let content = `${pattern.name} - 详细钩织步骤 (全部短针)\n`;
    content += '='.repeat(60) + '\n\n';

    content += `图解尺寸: ${pattern.width} × ${pattern.height}\n`;
    content += `每行针数: ${pattern.stitchesPerRow} 针\n`;
    content += `使用颜色: ${pattern.colors.length} 种\n\n`;

    content += '颜色图例:\n';
    content += '-'.repeat(30) + '\n';
    pattern.colors.forEach((color, index) => {
      const totalStitches = detailedSteps.reduce(
        (sum, step) => sum + (step.stitchCount[color.id] || 0), 0
      );
      content += `${index + 1}. ${color.name} (${color.hexCode}) - ${totalStitches} 针\n`;
    });

    content += '\n详细钩织步骤:\n';
    content += '-'.repeat(40) + '\n';

    detailedSteps.forEach(step => {
      content += `\n第${step.row}行 (共${step.totalStitches}针, ${step.direction === 'right' ? '从左到右' : '从右到左'}):\n`;

      let currentColor = step.stitches[0]?.color;
      let currentCount = 0;
      let instructions = [];

      for (const stitch of step.stitches) {
        if (stitch.color.id !== currentColor.id) {
          instructions.push(`${currentCount}短针${currentColor.name}`);
          currentColor = stitch.color;
          currentCount = 1;
        } else {
          currentCount++;
        }
      }
      if (currentCount > 0) {
        instructions.push(`${currentCount}短针${currentColor.name}`);
      }

      content += `  ${instructions.join(', ')}\n`;

      // 详细入针点信息
      content += '  入针点: ';
      const insertPoints = step.stitches.map(s =>
        `第${s.position}针${s.isColorChange ? '(换线)' : ''}`
      );
      content += insertPoints.join(' → ') + '\n';
    });

    return content;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* 标题和控制按钮 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">详细钩织步骤生成器</h3>

          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'visual' ? 'list' : 'visual')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm"
              title="切换视图模式"
            >
              {viewMode === 'visual' ? <List size={16} /> : <Grid size={16} />}
              <span>{viewMode === 'visual' ? '列表视图' : '图表视图'}</span>
            </button>

            <button
              onClick={downloadInstructions}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2 text-sm"
              title="下载详细步骤"
            >
              <Download size={16} />
              <span>下载</span>
            </button>
          </div>
        </div>

        {/* 显示选项 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInsertPoints}
                onChange={(e) => setShowInsertPoints(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">显示入针点编号</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showColorChanges}
                onChange={(e) => setShowColorChanges(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-700">显示换线节点</span>
            </label>

            <button
              onClick={expandAll}
              className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              展开全部
            </button>

            <button
              onClick={collapseAll}
              className="px-3 py-1 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              收起全部
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">钩织统计</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-blue-700">总行数</div>
              <div className="text-lg font-medium text-blue-900">
                {detailedSteps.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">每行针数</div>
              <div className="text-lg font-medium text-blue-900">
                {pattern.stitchesPerRow} 针
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">使用颜色</div>
              <div className="text-lg font-medium text-blue-900">
                {pattern.colors.length} 种
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-700">总针数</div>
              <div className="text-lg font-medium text-blue-900">
                {detailedSteps.reduce((sum, step) => sum + step.totalStitches, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 颜色使用统计 */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm text-blue-700 mb-2">各颜色用量统计:</div>
            <div className="flex flex-wrap gap-3">
              {pattern.colors.map((color) => {
                const totalStitches = detailedSteps.reduce(
                  (sum, step) => sum + (step.stitchCount[color.id] || 0), 0
                );
                return (
                  <div key={color.id} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span className="text-sm text-blue-800">
                      {color.name}: {totalStitches}针
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 详细步骤列表 */}
        <div className="space-y-4">
          {detailedSteps.map((step) => (
            <div
              key={step.row}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* 行标题 */}
              <button
                onClick={() => toggleRowExpansion(step.row)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">
                    第 {step.row} 行
                  </span>
                  <span className="text-sm text-gray-600">
                    ({step.totalStitches} 针, {step.direction === 'right' ? '从左到右 →' : '从右到左 ←'})
                  </span>

                  {/* 颜色分段指示 */}
                  <div className="flex space-x-1">
                    {Array.from(new Set(step.stitches.map(s => s.color.id))).map((colorId) => {
                      const color = step.stitches.find(s => s.color.id === colorId)?.color;
                      const count = step.stitchCount[colorId] || 0;
                      return color ? (
                        <div
                          key={colorId}
                          className="flex items-center space-x-1 px-2 py-1 bg-white rounded border border-gray-200"
                          title={`${color.name}: ${count}针`}
                        >
                          <div
                            className="w-3 h-3 rounded border border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <span className="text-xs text-gray-600">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {expandedRows.has(step.row) ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>

              {/* 展开的详细内容 */}
              {expandedRows.has(step.row) && (
                <div className="p-4 bg-white">
                  {viewMode === 'visual' ? (
                    // 可视化图表视图
                    <div className="space-y-4">
                      <canvas
                        ref={el => canvasRefs.current[step.row] = el}
                        className="border border-gray-300 rounded mx-auto"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />

                      {/* 文字说明 */}
                      <div className="text-sm text-gray-700 space-y-2">
                        <div>
                          <strong>编织说明:</strong> 第{step.row}行共{step.totalStitches}针，{step.direction === 'right' ? '从左到右' : '从右到左'}编织
                        </div>
                        <div>
                          <strong>针目组成:</strong>
                          {Object.entries(step.stitchCount).map(([colorId, count]) => {
                            const color = step.stitches.find(s => s.color.id === colorId)?.color;
                            return color ? (
                              <span key={colorId} className="inline-flex items-center space-x-1 ml-2">
                                <div
                                  className="w-3 h-3 rounded border border-gray-300"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                                <span>{count}针{color.name}</span>
                              </span>
                            ) : null;
                          })}
                        </div>

                        {step.stitches.some(s => s.isColorChange) && (
                          <div>
                            <strong>换线位置:</strong>
                            {step.stitches.filter(s => s.isColorChange).map(change => (
                              <span key={change.position} className="ml-2">
                                第{change.position}针 ({change.color.name})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // 列表视图
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        第{step.row}行详细步骤 ({step.direction === 'right' ? '从左到右' : '从右到左'}):
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {step.stitches.map((stitch) => (
                          <div
                            key={stitch.position}
                            className={`flex items-center space-x-2 p-2 rounded border ${
                              stitch.isColorChange && showColorChanges
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: stitch.color.hexCode }}
                            />
                            <span className="text-sm text-gray-700">
                              {stitch.position}. {stitch.color.name}
                            </span>
                            {stitch.isColorChange && showColorChanges && (
                              <span className="text-xs text-red-600 font-medium">换线</span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          <strong>编织指令:</strong>
                          {Object.entries(step.stitchCount).map(([colorId, count], index) => {
                            const color = step.stitches.find(s => s.color.id === colorId)?.color;
                            return color ? (
                              <span key={colorId}>
                                {index > 0 && ', '}
                                {count}短针({color.name})
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
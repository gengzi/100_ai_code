import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Download, Printer } from 'lucide-react';
import { CrochetInstruction, YarnColor } from '../types';

interface CrochetInstructionsProps {
  instructions: CrochetInstruction[];
  colors: YarnColor[];
  patternName: string;
  className?: string;
}

export const CrochetInstructions: React.FC<CrochetInstructionsProps> = ({
  instructions,
  colors,
  patternName,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'legend', 'instructions'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = () => {
    const content = generateTextContent();
    navigator.clipboard.writeText(content).then(() => {
      alert('说明已复制到剪贴板！');
    });
  };

  const downloadInstructions = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patternName}_编织说明.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printInstructions = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${patternName} - 编织说明</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              h1 { color: #333; border-bottom: 2px solid #333; }
              h2 { color: #666; margin-top: 30px; }
              .legend-item { margin: 5px 0; }
              .instruction { margin: 8px 0; padding: 8px; background: #f9f9f9; border-radius: 4px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${generateHTMLContent()}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateTextContent = (): string => {
    let content = `${patternName} - 钩针编织说明\n`;
    content += '='.repeat(50) + '\n\n';

    // 基本信息
    content += `图解尺寸: ${instructions.length} 行\n`;
    content += `使用颜色: ${colors.length} 种\n\n`;

    // 颜色图例
    content += '颜色图例:\n';
    content += '-'.repeat(30) + '\n';
    colors.forEach((color, index) => {
      content += `${index + 1}. ${color.name} (${color.hexCode})\n`;
    });

    // 编织说明
    content += '\n编织步骤:\n';
    content += '-'.repeat(30) + '\n';
    instructions.forEach((instruction) => {
      content += `第${instruction.row}行: ${instruction.instructions}\n`;
    });

    return content;
  };

  const generateHTMLContent = (): string => {
    let content = `<h1>${patternName} - 编织说明</h1>`;

    // 基本信息
    content += '<h2>基本信息</h2>';
    content += `<p>图解尺寸: ${instructions.length} 行</p>`;
    content += `<p>使用颜色: ${colors.length} 种</p>`;

    // 颜色图例
    content += '<h2>颜色图例</h2>';
    colors.forEach((color, index) => {
      content += `<div class="legend-item">
        <strong>${index + 1}.</strong> ${color.name} (${color.hexCode})
      </div>`;
    });

    // 编织说明
    content += '<h2>编织步骤</h2>';
    instructions.forEach((instruction) => {
      content += `<div class="instruction">
        <strong>第${instruction.row}行:</strong> ${instruction.instructions}
      </div>`;
    });

    return content;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">编织说明</h3>

          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2 text-sm"
              title="复制说明"
            >
              <Copy size={16} />
              <span>复制</span>
            </button>

            <button
              onClick={downloadInstructions}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center space-x-2 text-sm"
              title="下载说明"
            >
              <Download size={16} />
              <span>下载</span>
            </button>

            <button
              onClick={printInstructions}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-2 text-sm"
              title="打印说明"
            >
              <Printer size={16} />
              <span>打印</span>
            </button>
          </div>
        </div>

        {/* 概览部分 */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-900">概览信息</h4>
            {expandedSections.has('overview') ? (
              <ChevronUp size={20} className="text-gray-500" />
            ) : (
              <ChevronDown size={20} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has('overview') && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">总行数</div>
                    <div className="text-lg font-medium text-gray-900">
                      {instructions.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">使用颜色</div>
                    <div className="text-lg font-medium text-gray-900">
                      {colors.length} 种
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">每行针数</div>
                    <div className="text-lg font-medium text-gray-900">
                      {instructions[0]?.stitchCount || 0} 针
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">总针数</div>
                    <div className="text-lg font-medium text-gray-900">
                      {instructions.reduce((sum, inst) => sum + inst.stitchCount, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 颜色图例部分 */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('legend')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-900">颜色图例</h4>
            {expandedSections.has('legend') ? (
              <ChevronUp size={20} className="text-gray-500" />
            ) : (
              <ChevronDown size={20} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has('legend') && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {colors.map((color, index) => (
                  <div key={color.id} className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span className="text-sm text-gray-700">
                      {index + 1}. {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 编织说明部分 */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('instructions')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-900">编织步骤</h4>
            {expandedSections.has('instructions') ? (
              <ChevronUp size={20} className="text-gray-500" />
            ) : (
              <ChevronDown size={20} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has('instructions') && (
            <div className="px-4 pb-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {instructions.map((instruction) => (
                  <div
                    key={instruction.row}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-blue-900">
                            第 {instruction.row} 行
                          </span>
                          <span className="text-sm text-blue-700">
                            ({instruction.stitchCount} 针)
                          </span>
                        </div>
                        <div className="text-sm text-blue-800 font-mono">
                          {instruction.instructions}
                        </div>

                        {instruction.colorChanges.length > 0 && (
                          <div className="mt-2 text-xs text-blue-700">
                            <div className="font-medium mb-1">颜色变化:</div>
                            <div className="space-y-1">
                              {instruction.colorChanges.map((change, index) => (
                                <div key={index}>
                                  第 {change.stitch + 1} 针:
                                  {change.fromColor.name} → {change.toColor.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 编织技巧部分 */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => toggleSection('tips')}
            className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h4 className="font-medium text-gray-900">编织技巧</h4>
            {expandedSections.has('tips') ? (
              <ChevronUp size={20} className="text-gray-500" />
            ) : (
              <ChevronDown size={20} className="text-gray-500" />
            )}
          </button>

          {expandedSections.has('tips') && (
            <div className="px-4 pb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-medium text-yellow-900 mb-3">💡 编织小贴士</h5>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• 在编织前先练习基础针法，熟悉手感</li>
                  <li>• 使用记号扣标记每行的开始，避免错行</li>
                  <li>• 颜色更换时注意藏好线头，保持作品整洁</li>
                  <li>• 定期检查针数，确保与图解一致</li>
                  <li>• 编织完成后进行适当熨烫，效果更佳</li>
                  <li>• 复杂图案可以分段编织，更容易掌握</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
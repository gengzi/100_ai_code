import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, Download, Eye, Settings, Zap } from 'lucide-react';
import { Crochet3DInstruction, LayeredCrochetPattern } from '../utils/crochet3DGenerator';

interface Crochet3DInstructionsProps {
  pattern: LayeredCrochetPattern;
  className?: string;
}

export const Crochet3DInstructions: React.FC<Crochet3DInstructionsProps> = ({
  pattern,
  className = ''
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([0]));
  const [selectedView, setSelectedView] = useState<'layered' | 'sequential'>('layered');
  const [showDetails, setShowDetails] = useState(true);
  const [show3DTips, setShow3DTips] = useState(true);

  const { baseLayer, depthLayers, layerInfo, totalInstructions } = pattern;

  const toggleLayer = (layerId: number) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const expandAllLayers = () => {
    const allLayerIds = [-1, ...depthLayers.map((_, index) => index)];
    setExpandedLayers(new Set(allLayerIds));
  };

  const collapseAllLayers = () => {
    setExpandedLayers(new Set());
  };

  const exportInstructions = () => {
    const content = generateTextInstructions();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3d-crochet-instructions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateTextInstructions = () => {
    let content = '3D立体钩织图解说明\n';
    content += '=' .repeat(50) + '\n\n';

    // 添加层级信息
    content += '层级信息:\n';
    layerInfo.forEach(layer => {
      content += `层级${layer.depth}: ${layer.color} (${layer.stitchCount}针) - ${layer.techniques.join(', ')}\n`;
    });
    content += '\n';

    // 添加编织顺序
    content += '编织顺序:\n';
    content += '1. 基础层 (底层)\n';
    depthLayers.forEach((layer, index) => {
      content += `${index + 2}. 第${layerInfo[index].depth}层\n`;
    });
    content += '\n';

    // 添加详细指令
    content += '详细编织指令:\n';
    content += '-' .repeat(30) + '\n\n';

    // 基础层指令
    content += '【基础层】\n';
    baseLayer.forEach(instruction => {
      content += `第${instruction.row}行: ${instruction.instructions}\n`;
      if (instruction.notes) {
        content += `  备注: ${instruction.notes.join(', ')}\n`;
      }
    });
    content += '\n';

    // 各层指令
    depthLayers.forEach((layer, layerIndex) => {
      content += `【第${layerInfo[layerIndex].depth}层】\n`;
      layer.forEach(instruction => {
        content += `第${instruction.row}行: ${instruction.instructions}\n`;
        if (instruction.stitch3DType) {
          content += `  3D针法: ${instruction.stitch3DType}\n`;
        }
        if (instruction.notes) {
          content += `  备注: ${instruction.notes.join(', ')}\n`;
        }
      });
      content += '\n';
    });

    return content;
  };

  const getStitchDescription = (stitch3DType?: 'surface' | 'edge' | 'highlight'): string => {
    switch (stitch3DType) {
      case 'surface': return '表面编织';
      case 'edge': return '边缘强化';
      case 'highlight': return '高光处理';
      default: return '标准编织';
    }
  };

  const getStitchIcon = (stitch3DType?: 'surface' | 'edge' | 'highlight'): string => {
    switch (stitch3DType) {
      case 'surface': return '✕';
      case 'edge': return 'V';
      case 'highlight': return '●';
      default: return '✕';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 控制面板 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-purple-600" />
            3D钩织指令
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={exportInstructions}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
          </div>
        </div>

        {/* 视图选择 */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm font-medium text-gray-700">视图模式:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedView('layered')}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedView === 'layered'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              分层视图
            </button>
            <button
              onClick={() => setSelectedView('sequential')}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedView === 'sequential'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              顺序视图
            </button>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-3 py-1 rounded-md text-sm ${
              showDetails
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showDetails ? '隐藏' : '显示'}详情
          </button>

          <button
            onClick={() => setShow3DTips(!show3DTips)}
            className={`px-3 py-1 rounded-md text-sm ${
              show3DTips
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {show3DTips ? '隐藏' : '显示'}3D技巧
          </button>
        </div>

        {/* 层级展开控制 */}
        <div className="flex space-x-2">
          <button
            onClick={expandAllLayers}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            展开全部
          </button>
          <button
            onClick={collapseAllLayers}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            收起全部
          </button>
        </div>
      </div>

      {/* 3D钩织技巧提示 */}
      {show3DTips && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            3D钩织技巧
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div>
              <strong>基础层技巧：</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• 使用较紧密的钩织密度作为底层支撑</li>
                <li>• 选择深色线材，增强立体阴影效果</li>
                <li>• 确保基础层平整，为上层提供稳定基础</li>
              </ul>
            </div>
            <div>
              <strong>分层技巧：</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• 按深度顺序逐层钩织，从深层到浅层</li>
                <li>• 边缘使用长针增强立体轮廓</li>
                <li>• 高光区域使用爆米花针增加质感</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 层级信息概览 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">层级概览</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">1</div>
            <div className="text-xs text-gray-600">基础层</div>
            <div className="text-xs text-blue-600">底层支撑</div>
          </div>
          {layerInfo.map((layer, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-gray-900">{layer.depth}</div>
              <div className="text-xs text-gray-600">{layer.color}</div>
              <div className="text-xs text-green-600">{layer.techniques[0] || '表面'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 指令展示 */}
      {selectedView === 'layered' ? (
        <div className="space-y-4">
          {/* 基础层 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleLayer(-1)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedLayers.has(-1) ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-800 rounded"></div>
                  <span className="font-medium text-gray-900">基础层 (底层支撑)</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {baseLayer.length} 行
              </div>
            </button>

            {expandedLayers.has(-1) && (
              <div className="border-t border-gray-200 p-4">
                <div className="space-y-2">
                  {baseLayer.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {instruction.row}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          {instruction.instructions}
                        </div>
                        {showDetails && instruction.notes && (
                          <div className="mt-1 text-xs text-gray-600">
                            💡 {instruction.notes.join(' | ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 深度层 */}
          {depthLayers.map((layer, layerIndex) => (
            <div key={layerIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleLayer(layerIndex)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedLayers.has(layerIndex) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: layerInfo[layerIndex].color === '白色' ? '#F5F5DC' : layerInfo[layerIndex].color }}
                    ></div>
                    <span className="font-medium text-gray-900">
                      第{layerInfo[layerIndex].depth}层 - {layerInfo[layerIndex].color}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {layer.length} 行
                  </div>
                  <div className="text-sm text-purple-600">
                    {layerInfo[layerIndex].stitchCount} 针
                  </div>
                </div>
              </button>

              {expandedLayers.has(layerIndex) && (
                <div className="border-t border-gray-200 p-4">
                  {showDetails && layerInfo[layerIndex].techniques.length > 0 && (
                    <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-900 mb-1">特殊技巧:</div>
                      <div className="flex flex-wrap gap-2">
                        {layerInfo[layerIndex].techniques.map((technique, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs">
                            {technique}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {layer.map((instruction, index) => (
                      <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-sm font-medium text-purple-700">
                          {instruction.row}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900 flex items-center space-x-2">
                            <span>{instruction.instructions}</span>
                            {instruction.stitch3DType && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {getStitchIcon(instruction.stitch3DType)} {getStitchDescription(instruction.stitch3DType)}
                              </span>
                            )}
                          </div>
                          {showDetails && instruction.notes && (
                            <div className="mt-1 text-xs text-gray-600">
                              💡 {instruction.notes.join(' | ')}
                            </div>
                          )}
                          {showDetails && instruction.colorChanges && instruction.colorChanges.length > 0 && (
                            <div className="mt-1 text-xs text-blue-600">
                              🔄 包含 {instruction.colorChanges.length} 处换线
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* 顺序视图 */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="space-y-2">
            {totalInstructions.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-sm font-medium text-purple-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 flex items-center space-x-2">
                    <span className="font-medium">
                      {instruction.layerId === -1 ? '基础层' : `第${instruction.depth}层`}:
                    </span>
                    <span>{instruction.instructions}</span>
                    {instruction.is3DElement && instruction.stitch3DType && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {getStitchIcon(instruction.stitch3DType)} {getStitchDescription(instruction.stitch3DType)}
                      </span>
                    )}
                  </div>
                  {showDetails && instruction.notes && (
                    <div className="mt-1 text-xs text-gray-600">
                      💡 {instruction.notes.join(' | ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">编织统计</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {totalInstructions.length}
            </div>
            <div className="text-sm text-gray-600">总行数</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {depthLayers.length + 1}
            </div>
            <div className="text-sm text-gray-600">层级数</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {totalInstructions.filter(i => i.is3DElement).length}
            </div>
            <div className="text-sm text-gray-600">3D元素</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {layerInfo.reduce((sum, l) => sum + l.stitchCount, baseLayer.length * 40)}
            </div>
            <div className="text-sm text-gray-600">总针数</div>
          </div>
        </div>
      </div>
    </div>
  );
};
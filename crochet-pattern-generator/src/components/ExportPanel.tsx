import React, { useState } from 'react';
import { Download, Share2, Printer, Settings, Image, FileText } from 'lucide-react';
import { CrochetPattern, ExportOptions } from '../types';
import { exportUtils } from '../utils/exportUtils';

interface ExportPanelProps {
  pattern: CrochetPattern;
  patternElement: React.RefObject<HTMLDivElement>;
  className?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  pattern,
  patternElement,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    includeInstructions: true,
    includeColorLegend: true,
    includeGrid: true,
    dpi: 300
  });

  const handleExport = async (format: 'pdf' | 'png' | 'jpg') => {
    if (!patternElement.current) {
      alert('请先生成图解！');
      return;
    }

    setIsExporting(true);
    try {
      const options = { ...exportOptions, format };

      if (format === 'pdf') {
        await exportUtils.exportToPDF(patternElement.current, pattern, options);
      } else {
        await exportUtils.exportToImage(patternElement.current, pattern, options);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试！');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!patternElement.current) return;

    setIsExporting(true);
    try {
      await exportUtils.sharePattern(patternElement.current, pattern);
    } catch (error) {
      console.error('分享失败:', error);
      alert('分享失败，请重试！');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (!patternElement.current) return;

    setIsExporting(true);
    try {
      await exportUtils.printPattern(patternElement.current);
    } catch (error) {
      console.error('打印失败:', error);
      alert('打印失败，请重试！');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportInstructions = () => {
    exportUtils.exportInstructions(pattern);
  };

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">导出图解</h3>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="导出设置"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* 导出设置 */}
        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900 mb-3">导出设置</h4>

            {/* 导出格式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                导出格式
              </label>
              <div className="flex space-x-3">
                {(['png', 'jpg', 'pdf'] as const).map(format => (
                  <label key={format} className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={exportOptions.format === format}
                      onChange={(e) => updateOption('format', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 uppercase">{format}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 包含内容选项 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                包含内容
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeInstructions}
                    onChange={(e) => updateOption('includeInstructions', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">包含编织说明</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeColorLegend}
                    onChange={(e) => updateOption('includeColorLegend', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">包含颜色图例</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeGrid}
                    onChange={(e) => updateOption('includeGrid', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">包含网格线</span>
                </label>
              </div>
            </div>

            {/* DPI设置（仅PDF） */}
            {exportOptions.format === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分辨率 (DPI)
                </label>
                <select
                  value={exportOptions.dpi}
                  onChange={(e) => updateOption('dpi', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={150}>150 DPI (标准)</option>
                  <option value={300}>300 DPI (高质量)</option>
                  <option value={600}>600 DPI (超高质量)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 快速导出按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => handleExport('png')}
            disabled={isExporting}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image size={24} className="text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">导出为图片</span>
            <span className="text-xs text-gray-500">PNG格式</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={24} className="text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">导出为PDF</span>
            <span className="text-xs text-gray-500">含说明</span>
          </button>

          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={24} className="text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">分享</span>
            <span className="text-xs text-gray-500">社交媒体</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isExporting}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={24} className="text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">打印</span>
            <span className="text-xs text-gray-500">直接打印</span>
          </button>
        </div>

        {/* 其他导出选项 */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">其他选项</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExport('jpg')}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download size={16} className="inline mr-2" />
              导出为JPG
            </button>

            <button
              onClick={handleExportInstructions}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Download size={16} className="inline mr-2" />
              下载说明文本
            </button>
          </div>
        </div>

        {/* 导出状态提示 */}
        {isExporting && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm text-blue-800">正在导出，请稍候...</span>
            </div>
          </div>
        )}

        {/* 导出建议 */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">📋 导出建议</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>PNG格式:</strong> 适合在线分享和数字查看</li>
            <li>• <strong>PDF格式:</strong> 适合打印和完整说明文档</li>
            <li>• <strong>JPG格式:</strong> 文件较小，适合传输</li>
            <li>• <strong>高质量DPI:</strong> 打印时建议选择300DPI或更高</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
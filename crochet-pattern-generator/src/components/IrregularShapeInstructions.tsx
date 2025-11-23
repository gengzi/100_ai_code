import React from 'react';
import { CrochetPattern } from '../types';

interface IrregularShapeInstructionsProps {
  pattern: CrochetPattern;
  imageAnalysisResult?: any;
}

export const IrregularShapeInstructions: React.FC<IrregularShapeInstructionsProps> = ({
  pattern,
  imageAnalysisResult: _imageAnalysisResult
}) => {
  const analyzeIrregularShape = () => {
    // 分析不规则形状的特征
    const grid = pattern.grid;
    const shapeInfo = {
      hasIrregularShape: false,
      shapeType: 'regular' as 'regular' | 'organic' | 'geometric' | 'complex',
      irregularEdges: [] as number[],
      hollowAreas: [] as {x: number, y: number, width: number, height: number}[],
      maxWidth: 0,
      maxHeight: 0
    };

    // 检测形状是否规则
    let nonEmptyCells = 0;
    let totalCells = 0;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y]?.length || 0; x++) {
        totalCells++;
        // 检查是否为透明或空白区域（基于颜色判断）
        const cell = grid[y][x];
        const isEmpty = cell.color.hexCode === '#FFFFFF' || cell.color.name.includes('白');

        if (!isEmpty) {
          nonEmptyCells++;
          // 检查是否为边缘
          const hasEmptyNeighbor =
            (y > 0 && grid[y-1]?.[x] && (grid[y-1][x].color.hexCode === '#FFFFFF')) ||
            (y < grid.length - 1 && grid[y+1]?.[x] && (grid[y+1][x].color.hexCode === '#FFFFFF')) ||
            (x > 0 && grid[y][x-1] && (grid[y][x-1].color.hexCode === '#FFFFFF')) ||
            (x < (grid[y]?.length || 0) - 1 && grid[y][x+1] && (grid[y][x+1].color.hexCode === '#FFFFFF'));

          if (hasEmptyNeighbor) {
            shapeInfo.irregularEdges.push(y * pattern.width + x);
          }
        } else {
          // 检测空心区域
          const hasNonEmptyNeighbor =
            (y > 0 && grid[y-1]?.[x] && (grid[y-1][x].color.hexCode !== '#FFFFFF')) ||
            (y < grid.length - 1 && grid[y+1]?.[x] && (grid[y+1][x].color.hexCode !== '#FFFFFF')) ||
            (x > 0 && grid[y][x-1] && (grid[y][x-1].color.hexCode !== '#FFFFFF')) ||
            (x < (grid[y]?.length || 0) - 1 && grid[y][x+1] && (grid[y][x+1].color.hexCode !== '#FFFFFF'));

          if (hasNonEmptyNeighbor) {
            shapeInfo.hollowAreas.push({ x, y, width: 1, height: 1 });
          }
        }
      }
    }

    // 计算形状特征
    const fillRatio = nonEmptyCells / totalCells;
    const edgeRatio = shapeInfo.irregularEdges.length / nonEmptyCells;

    if (fillRatio < 0.7 || edgeRatio > 0.3) {
      shapeInfo.hasIrregularShape = true;
    }

    // 判断形状类型
    if (edgeRatio > 0.4) {
      shapeInfo.shapeType = 'organic';
    } else if (edgeRatio > 0.2) {
      shapeInfo.shapeType = 'complex';
    } else if (fillRatio < 0.8) {
      shapeInfo.shapeType = 'geometric';
    }

    return shapeInfo;
  };

  const shapeInfo = analyzeIrregularShape();

  const generateIrregularShapeInstructions = () => {
    const instructions = [];

    if (shapeInfo.hasIrregularShape) {
      instructions.push(
        '🎯 不规则图形钩织说明',
        '═'.repeat(25),
        '',
        '📐 形状分析：',
        `• 形状类型：${shapeInfo.shapeType === 'organic' ? '有机形状' :
                      shapeInfo.shapeType === 'geometric' ? '几何形状' :
                      shapeInfo.shapeType === 'complex' ? '复杂形状' : '常规形状'}`,
        `• 边缘复杂度：${shapeInfo.irregularEdges.length > 10 ? '高' :
                         shapeInfo.irregularEdges.length > 5 ? '中' : '低'}`,
        shapeInfo.hollowAreas.length > 0 ? `• 包含空心区域：${shapeInfo.hollowAreas.length}个` : '',
        ''
      );

      // 不规则形状的特殊技巧
      instructions.push(
        '🔧 特殊编织技巧：',
        '',
        '1. 轮廓跟踪法：',
        '   • 按照图形轮廓逐行编织',
        '   • 遇到空白区域时跳过，继续下一针',
        '   • 使用引拔针连接断开的区域',
        '',
        '2. 立体塑形：',
        '   • 在轮廓边缘使用减针（2并1针）',
        '   • 转角处使用短针或引拔针保持形状',
        '   • 必要时使用定型线辅助塑形',
        '',
        '3. 连接技巧：',
        '   • 断开区域使用锁针连接',
        '   • 跳针时在背面留下约5cm线头',
        '   • 最后统一处理线头和连接',
        ''
      );

      // 针对特定形状类型的建议
      if (shapeInfo.shapeType === 'organic') {
        instructions.push(
          '🌿 有机形状编织要点：',
          '• 使用短针配合长针表现曲线',
          '• 在弯曲处适当增减针',
          '• 注意保持整体比例平衡',
          '• 可以使用不同密度表现立体感',
          ''
        );
      }

      if (shapeInfo.hollowAreas.length > 0) {
        instructions.push(
          '🕳️ 空心区域处理：',
          '• 空心区域直接跳过不编织',
          '• 注意空心边缘的连接',
          '• 必要时使用环绕编织加固',
          '• 最后检查空心形状是否完整',
          ''
        );
      }

      // 颜色变化建议
      if (pattern.colors.length > 1) {
        instructions.push(
          '🎨 颜色变化处理：',
          '• 在颜色变化区域使用浮线技巧减少线头',
          '• 复杂区域建议分段编织再拼接',
          '• 保持背面整洁便于后期整理',
          ''
        );
      }

      // 完成后处理
      instructions.push(
        '✨ 完成后处理：',
        '1. 轻柔熨烫定型（注意材质）',
        '2. 整理所有线头，藏好结尾',
        '3. 检查形状是否与原图一致',
        '4. 必要时使用定型剂固定形状',
        '',
        '💡 贴士：',
        '• 编织过程中随时对比原图',
        '• 不要过度拉扯，保持自然形状',
        '• 复杂区域可以先做小样测试',
        '• 耐心是成功的关键！'
      );
    } else {
      instructions.push(
        '🔲 常规形状说明',
        '',
        '这个图案相对规整，可以按照标准的逐行编织方式进行。',
        '',
        '📋 标准编织流程：',
        '1. 从底部开始逐行向上编织',
        '2. 每行按图示颜色和针法进行',
        '3. 注意颜色变化时的换线技巧',
        '4. 完成后进行适当的定型处理'
      );
    }

    return instructions;
  };

  const instructions = generateIrregularShapeInstructions();

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 不规则图形编织指南</h3>

      <div className="space-y-4 text-sm">
        {instructions.map((instruction, index) => {
          if (instruction === '') {
            return <div key={index} className="h-2" />;
          }

          if (instruction.includes('═'.repeat(25))) {
            return <div key={index} className="border-b border-gray-300 my-2" />;
          }

          if (instruction.startsWith('•')) {
            return (
              <div key={index} className="ml-6 text-gray-700">
                {instruction}
              </div>
            );
          }

          if (instruction.match(/^\d+\./)) {
            return (
              <div key={index} className="ml-4 text-gray-700 font-medium">
                {instruction}
              </div>
            );
          }

          return (
            <div key={index} className={`${
              instruction.includes('🎯') || instruction.includes('🌿') ||
              instruction.includes('🕳️') || instruction.includes('🎨') ||
              instruction.includes('✨') || instruction.includes('💡') ||
              instruction.includes('📐') || instruction.includes('🔧') ||
              instruction.includes('🔲') || instruction.includes('📋')
                ? 'text-gray-900 font-semibold text-base'
                : 'text-gray-700'
            }`}>
              {instruction}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>提示：</strong>这些说明针对不规则图形的特殊编织需求。如果觉得太复杂，
          可以先从简单的区域开始练习，逐渐掌握技巧后再处理复杂部分。
        </p>
      </div>
    </div>
  );
};
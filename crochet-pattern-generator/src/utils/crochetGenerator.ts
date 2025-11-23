import { YarnColor, CrochetInstruction, ColorChange, StitchType, StitchDetail, PatternSettings } from '../types';
import { CROCHET_SYMBOLS, recommendStitchPattern, getStitchInstructions, getStitchesByDifficulty } from './crochetSymbols';

export class CrochetGenerator {

  /**
   * 生成增强的编织指令
   */
  generateInstructions(
    colorGrid: YarnColor[][],
    settings: PatternSettings
  ): CrochetInstruction[] {
    const instructions: CrochetInstruction[] = [];
    const rows = colorGrid.length;
    const availableStitches = getStitchesByDifficulty(settings.difficulty);

    // 分析图片复杂度并推荐针法组合
    const imageComplexity = this.analyzeImageComplexity(colorGrid);
    const stitchRecommendation = settings.autoStitchPattern
      ? recommendStitchPattern(imageComplexity, settings.difficulty)
      : { primaryStitch: settings.stitchType, recommendations: [] };

    for (let row = 0; row < rows; row++) {
      const instruction = this.generateEnhancedRowInstruction(
        colorGrid,
        row + 1,
        settings,
        stitchRecommendation,
        availableStitches
      );
      instructions.push(instruction);
    }

    return instructions;
  }

  
  
  /**
   * 生成详细教程步骤
   */
  generateTutorial(
    colorGrid: YarnColor[][],
    stitchType: StitchType,
    stitchesPerRow: number
  ): string[] {
    const tutorial: string[] = [];

    // 准备工作
    tutorial.push('🧶 准备工作：');
    tutorial.push('1. 准备所需的毛线颜色');
    tutorial.push('2. 选择合适号数的钩针');
    tutorial.push('3. 根据图解尺寸起针');
    tutorial.push('');

    // 基础针法说明
    tutorial.push('📖 基础针法说明：');
    tutorial.push(this.getStitchDescription(stitchType));
    tutorial.push('');

    // 编织步骤
    tutorial.push('🔢 编织步骤：');

    // 为保持向后兼容性，使用简化的设置对象
    const simpleSettings: PatternSettings = {
      width: 0,
      height: 0,
      stitchesPerRow,
      maxColors: 0,
      colorSimplification: 0,
      stitchType,
      removeBlackLines: false,
      autoStitchPattern: false,
      mixedStitches: false,
      difficulty: 'easy',
      showSymbols: false,
      showColorChangeMarkers: false,
      gauge: { stitchesPerInch: 4, rowsPerInch: 4 }
    };

    const instructions = this.generateInstructions(colorGrid, simpleSettings);
    instructions.forEach(inst => {
      tutorial.push(inst.instructions);
    });

    // 收尾工作
    tutorial.push('');
    tutorial.push('✨ 收尾工作：');
    tutorial.push('1. 编织完成后藏好线头');
    tutorial.push('2. 进行适当的熨烫整理');
    tutorial.push('3. 检查并修正错误');

    return tutorial;
  }

  /**
   * 获取针法的详细说明
   */
  private getStitchDescription(stitchType: StitchType): string {
    switch (stitchType) {
      case 'single':
        return '短针(X)：最基础的针法，插入下一针，钩线，拉出，再钩线穿过两个线圈';
      case 'double':
        return '长针(V)：绕线，插入下一针，钩线拉出，钩线穿过两个线圈，再钩线穿过剩余两个线圈';
      case 'half-double':
        return '中长针(H)：绕线，插入下一针，钩线拉出，钩线穿过所有三个线圈';
      case 'treble':
        return '特长针(T)：绕两次线，插入下一针，钩线拉出，(钩线穿过两个线圈)x3';
      case 'slip':
        return '引拔针(S)：插入下一针，钩线，直接穿过所有线圈';
      case 'chain':
        return '锁针(CH)：基础针法，用于起针和连接';
      default:
        return '根据选择的针法进行编织';
    }
  }

  /**
   * 估算用线量
   */
  estimateYarnUsage(
    colorGrid: YarnColor[][],
    stitchesPerRow: number,
    stitchSize: number = 1 // 每针的厘米数
  ): { [colorId: string]: number } {
    const usage: { [colorId: string]: number } = {};

    // 统计每种颜色的针数
    colorGrid.forEach(row => {
      for (let i = 0; i < stitchesPerRow && i < row.length; i++) {
        const colorId = row[i].id;
        usage[colorId] = (usage[colorId] || 0) + 1;
      }
    });

    // 转换为米数（假设每针需要1cm线）
    Object.keys(usage).forEach(colorId => {
      usage[colorId] = Math.ceil(usage[colorId] * stitchSize / 100); // 转换为米
    });

    return usage;
  }

  /**
   * 生成颜色图例
   */
  generateColorLegend(colors: YarnColor[]): string[] {
    const legend: string[] = [];
    legend.push('🎨 颜色图例：');

    colors.forEach((color, index) => {
      legend.push(`${index + 1}. ${color.name} (${color.hexCode})`);
    });

    return legend;
  }

  /**
   * 计算编织时间估算
   */
  estimateCrochetTime(
    totalRows: number,
    stitchesPerRow: number,
    skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): string {
    const totalStitches = totalRows * stitchesPerRow;

    // 每分钟完成的针数（基于技能水平）
    const stitchesPerMinute = {
      beginner: 15,
      intermediate: 25,
      advanced: 35
    }[skillLevel];

    const minutes = Math.ceil(totalStitches / stitchesPerMinute);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `约 ${hours} 小时 ${remainingMinutes} 分钟`;
    } else {
      return `约 ${minutes} 分钟`;
    }
  }

  /**
   * 分析图片复杂度
   */
  private analyzeImageComplexity(colorGrid: YarnColor[][]): 'simple' | 'moderate' | 'complex' {
    let colorChanges = 0;
    let totalCells = 0;

    for (let y = 0; y < colorGrid.length; y++) {
      for (let x = 0; x < colorGrid[y].length; x++) {
        totalCells++;
        // 检查相邻颜色变化
        if (x > 0 && colorGrid[y][x].id !== colorGrid[y][x - 1].id) colorChanges++;
        if (y > 0 && colorGrid[y][x].id !== colorGrid[y - 1][x].id) colorChanges++;
      }
    }

    const complexityRatio = colorChanges / totalCells;

    if (complexityRatio < 0.1) return 'simple';
    if (complexityRatio < 0.3) return 'moderate';
    return 'complex';
  }

  /**
   * 生成增强的单行指令
   */
  private generateEnhancedRowInstruction(
    colorGrid: YarnColor[][],
    rowNum: number,
    settings: PatternSettings,
    stitchRecommendation: any,
    availableStitches: StitchType[]
  ): CrochetInstruction {
    const row = colorGrid[rowNum - 1];
    const colorChanges: ColorChange[] = [];
    const stitchTypes: StitchDetail[] = [];
    let currentColor = row[0]!;
    let currentStitchType = stitchRecommendation.primaryStitch;
    let currentStitchCount = 0;
    let instructionParts: string[] = [];
    let stitchPosition = 0;

    // 分析颜色变化和针法选择
    for (let i = 0; i < settings.stitchesPerRow && i < row.length; i++) {
      const color = row[i]!;

      // 检测颜色变化
      if (color.id !== currentColor.id) {
        // 记录颜色变化
        colorChanges.push({
          stitch: i,
          fromColor: currentColor,
          toColor: color
        });

        // 添加当前针法组合到指令
        this.addStitchToInstruction(
          instructionParts,
          stitchTypes,
          currentStitchType,
          currentStitchCount,
          currentColor,
          stitchPosition
        );

        currentColor = color;
        currentStitchCount = 0;
        stitchPosition = i;
      }

      // 智能针法选择
      if (settings.mixedStitches && settings.autoStitchPattern && stitchRecommendation.secondaryStitches) {
        currentStitchType = this.selectOptimalStitch(
          row, i, availableStitches, stitchRecommendation.secondaryStitches
        );
      }

      currentStitchCount++;
    }

    // 添加最后一段针法
    this.addStitchToInstruction(
      instructionParts,
      stitchTypes,
      currentStitchType,
      currentStitchCount,
      currentColor,
      stitchPosition
    );

    // 生成详细的换线说明
    const notes = this.generateColorChangeNotes(colorChanges, rowNum, settings.showColorChangeMarkers);

    return {
      row: rowNum,
      instructions: this.formatEnhancedInstruction(instructionParts, rowNum, colorChanges.length > 0),
      stitchCount: settings.stitchesPerRow,
      colorChanges,
      stitchTypes,
      notes: notes.length > 0 ? notes : undefined,
      difficulty: this.calculateRowDifficulty(stitchTypes)
    };
  }

  /**
   * 添加针法到指令列表
   */
  private addStitchToInstruction(
    instructionParts: string[],
    stitchTypes: StitchDetail[],
    stitchType: StitchType,
    count: number,
    color: YarnColor,
    position: number
  ): void {
    if (count > 0) {
      const symbol = CROCHET_SYMBOLS[stitchType];
      instructionParts.push(`${count}${symbol.abbreviation}(${color.name})`);

      stitchTypes.push({
        type: stitchType,
        count,
        color,
        position,
        symbol: symbol.symbol
      });
    }
  }

  /**
   * 智能选择最优针法
   */
  private selectOptimalStitch(
    _row: YarnColor[],
    position: number,
    availableStitches: StitchType[],
    secondaryStitches?: StitchType[]
  ): StitchType {
    // 简单的针法选择逻辑，可以进一步复杂化
    if (position % 10 === 0 && secondaryStitches && secondaryStitches.length > 0) {
      // 每隔10针使用装饰针法
      const decorativeStitches = secondaryStitches.filter(s =>
        ['shell', 'popcorn', 'bobble'].includes(s)
      );
      if (decorativeStitches.length > 0) {
        return decorativeStitches[Math.floor(Math.random() * decorativeStitches.length)];
      }
    }

    return availableStitches[0] || 'single'; // 默认使用第一个可用针法
  }

  /**
   * 生成换线说明
   */
  private generateColorChangeNotes(
    colorChanges: ColorChange[],
    rowNum: number,
    showMarkers: boolean
  ): string[] {
    const notes: string[] = [];

    if (colorChanges.length > 0) {
      notes.push(`🔄 第${rowNum}行需要换线 ${colorChanges.length} 次`);

      colorChanges.forEach((change) => {
        if (showMarkers) {
          notes.push(`   在第${change.stitch}针处：${change.fromColor.name} → ${change.toColor.name}`);
          notes.push(`   💡 建议：在此位置打个结，防止脱线`);
        }
      });

      notes.push(`   📌 技巧：换线时在背面留约10cm线头，便于后期整理`);
    }

    return notes;
  }

  /**
   * 格式化增强的编织指令
   */
  private formatEnhancedInstruction(
    instructionParts: string[],
    rowNum: number,
    hasColorChanges: boolean
  ): string {
    const direction = rowNum % 2 === 1 ? '→ (从左到右)' : '← (从右到左)';
    let instruction = `第${rowNum}行 ${direction}: `;

    instruction += instructionParts.join(', ');

    if (hasColorChanges) {
      instruction += ' [含换线]';
    }

    return instruction;
  }

  /**
   * 计算行难度
   */
  private calculateRowDifficulty(stitchTypes: StitchDetail[]): 'easy' | 'medium' | 'hard' {
    let difficultyScore = 0;

    stitchTypes.forEach(stitch => {
      const symbol = CROCHET_SYMBOLS[stitch.type];
      switch (symbol.difficulty) {
        case 'medium': difficultyScore += 2; break;
        case 'hard': difficultyScore += 3; break;
        case 'easy': difficultyScore += 1; break;
      }
    });

    const averageScore = difficultyScore / stitchTypes.length;

    if (averageScore < 1.5) return 'easy';
    if (averageScore < 2.5) return 'medium';
    return 'hard';
  }

  /**
   * 生成增强的教程
   */
  generateEnhancedTutorial(
    colorGrid: YarnColor[][],
    settings: PatternSettings
  ): string[] {
    const tutorial: string[] = [];
    const imageComplexity = this.analyzeImageComplexity(colorGrid);
    const stitchRecommendation = settings.autoStitchPattern
      ? recommendStitchPattern(imageComplexity, settings.difficulty)
      : { primaryStitch: settings.stitchType, recommendations: [] };

    // 准备工作
    tutorial.push('🧶 钩织准备指南');
    tutorial.push('═'.repeat(30));
    tutorial.push('');
    tutorial.push('📋 材料准备：');
    tutorial.push('1. 所需颜色的毛线（根据颜色图例）');
    tutorial.push(`2. ${this.getRecommendedHookSize(settings.stitchType)}号钩针`);
    tutorial.push('3. 记号扣（用于标记行数）');
    tutorial.push('4. 剪刀和缝合针');
    tutorial.push('');

    // 针法说明
    tutorial.push('🔸 主要针法说明');
    tutorial.push('─'.repeat(25));
    tutorial.push('');

    const primaryStitchInfo = getStitchInstructions(stitchRecommendation.primaryStitch);
    tutorial.push(...primaryStitchInfo);

    if (stitchRecommendation.secondaryStitches) {
      tutorial.push('');
      tutorial.push('🔸 辅助针法');
      tutorial.push('─'.repeat(20));
      stitchRecommendation.secondaryStitches.forEach(stitch => {
        tutorial.push(...getStitchInstructions(stitch));
        tutorial.push('');
      });
    }

    // 推荐建议
    if (stitchRecommendation.recommendations.length > 0) {
      tutorial.push('💡 编织建议');
      tutorial.push('─'.repeat(20));
      stitchRecommendation.recommendations.forEach(rec => {
        tutorial.push(`• ${rec}`);
      });
      tutorial.push('');
    }

    // 换线技巧
    tutorial.push('🔄 换线技巧');
    tutorial.push('─'.repeat(20));
    tutorial.push('• 换线时在新颜色最后一针的最后一个线圈完成前换线');
    tutorial.push('• 在背面留下10-15cm的线头便于后期整理');
    tutorial.push('• 相邻颜色变化可以采用"浮线"技术减少线头');
    tutorial.push('• 定期检查线的张力，避免过紧或过松');
    tutorial.push('');

    return tutorial;
  }

  /**
   * 获取推荐钩针号数
   */
  private getRecommendedHookSize(stitchType: StitchType): string {
    const sizeMap = {
      'single': '2.5-3.5',
      'double': '3.5-4.5',
      'half-double': '3.0-4.0',
      'treble': '4.0-5.0',
      'double-treble': '5.0-6.0',
      'slip': '2.0-3.0',
      'chain': '2.5-3.5',
      'increase': '3.0-4.0',
      'decrease': '3.0-4.0',
      '2-together': '3.5-4.5',
      '3-together': '3.5-4.5',
      'shell': '4.0-5.0',
      'popcorn': '4.0-5.0',
      'bobble': '3.5-4.5',
      'front-post': '4.0-5.0',
      'back-post': '4.0-5.0'
    };

    return sizeMap[stitchType] || '3.5-4.5';
  }
}

export const crochetGenerator = new CrochetGenerator();
import { CrochetInstruction, ColorCell, YarnColor, PatternSettings } from '../types';

export interface CrochetRangeResult {
  instructions: CrochetInstruction[];
  totalStitches: number;
  estimatedRows: number;
  estimatedRounds: number;
  startInstructions: string[];
  technique: string;
}

export class CrochetRangeProcessor {
  /**
   * 根据钩织范围设置处理颜色网格，生成相应的钩织指令
   */
  processCrochetRange(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): CrochetRangeResult {
    const { crochetRange } = settings;
    const { width, height } = settings;

    if (crochetRange.type === 'full') {
      return this.processFullRange(colorGrid, settings);
    } else if (crochetRange.type === 'circular') {
      return this.processCircularRange(colorGrid, settings);
    } else {
      return this.processCustomRange(colorGrid, settings);
    }
  }

  /**
   * 处理完整范围
   */
  private processFullRange(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): CrochetRangeResult {
    const { crochetRange } = settings;
    const instructions: CrochetInstruction[] = [];

    // 根据钩织方向生成不同的起针说明
    const startInstructions: string[] = [];

    if (crochetRange.direction === 'rounds') {
      startInstructions.push('使用环形起针法开始');
      startInstructions.push(`起 ${colorGrid[0]?.length || 20} 针，连成环形`);
    } else {
      startInstructions.push(`起 ${colorGrid[0]?.length || 20} 锁针`);
      startInstructions.push('第1行：在每针锁针上钩1针短针');
    }

    // 生成行/圈钩织指令
    colorGrid.forEach((row, index) => {
      const rowIndex = index + 1;
      let instruction = '';
      let stitchCount = 0;
      const colorChanges: any[] = [];
      let currentColor: YarnColor | null = null;

      if (crochetRange.direction === 'rounds') {
        // 圈钩织 - 假设第一圈是圆形
        instruction = `第${rowIndex}圈: `;

        if (rowIndex === 1) {
          instruction += `${row.length}针短针 (环形起针)`;
          stitchCount = row.length;
        } else {
          // 计算加针
          const incCount = Math.floor(rowIndex / 2); // 简化的加针计算
          if (incCount > 0) {
            instruction += `[${row.length - incCount}针短针, ${incCount}针加针] * ${row.length}针`;
          } else {
            instruction += `${row.length}针短针`;
          }
          stitchCount = row.length;
        }
      } else {
        // 行钩织
        instruction = `第${rowIndex}行: `;

        // 分析颜色变化
        row.forEach((cell, cellIndex) => {
          if (cell && cell !== currentColor) {
            if (currentColor) {
              colorChanges.push({
                stitch: cellIndex + 1,
                fromColor: currentColor,
                toColor: cell
              });
            }
            currentColor = cell;
          }
          if (cell) stitchCount++;
        });

        if (colorChanges.length === 0) {
          instruction += `${stitchCount}针短针 (${currentColor?.name || '主色'})`;
        } else {
          instruction += this.generateColorChangeInstruction(row, currentColor, colorChanges);
        }
      }

      instructions.push({
        row: rowIndex,
        instructions: instruction,
        stitchCount,
        colorChanges,
        stitchTypes: [{
          type: settings.stitchType,
          count: stitchCount,
          color: currentColor || { id: 'main', name: '主色', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
          position: 1,
          symbol: '✕'
        }],
        notes: rowIndex === 1 ? [
          crochetRange.direction === 'rounds' ? '从中心开始圈钩织' : '从右到左钩织'
        ] : undefined
      });
    });

    return {
      instructions,
      totalStitches: this.calculateTotalStitches(instructions),
      estimatedRows: colorGrid.length,
      estimatedRounds: crochetRange.direction === 'rounds' ? colorGrid.length : 0,
      startInstructions,
      technique: this.getTechniqueName(crochetRange)
    };
  }

  /**
   * 处理圆形范围
   */
  private processCircularRange(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): CrochetRangeResult {
    const { crochetRange } = settings;
    const { radius = Math.min(settings.width, settings.height) / 2 } = crochetRange;
    const centerX = crochetRange.centerX || settings.width / 2;
    const centerY = crochetRange.centerY || settings.height / 2;

    const instructions: CrochetInstruction[] = [];
    const startInstructions: string[] = [
      `使用环形起针法，起6针短针连成环形`,
      '第1圈：6针短针'
    ];

    // 生成圈钩织指令，模拟圆形扩展
    let currentRadius = 1;
    let targetRadius = radius;

    while (currentRadius < targetRadius) {
      const roundInstructions = this.generateRoundInstructions(currentRadius, targetRadius, settings);

      instructions.push({
        row: currentRadius + 1,
        instructions: roundInstructions,
        stitchCount: this.calculateRoundStitchCount(currentRadius),
        colorChanges: [],
        stitchTypes: [{
          type: 'single',
          count: this.calculateRoundStitchCount(currentRadius),
          color: { id: 'main', name: '主色', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
          position: 1,
          symbol: '✕'
        }],
        notes: currentRadius === 1 ? ['环形起针完成，开始扩展'] : undefined
      });

      currentRadius++;
    }

    return {
      instructions,
      totalStitches: this.calculateTotalStitches(instructions),
      estimatedRows: 0,
      estimatedRounds: instructions.length,
      startInstructions,
      technique: '圆形圈钩织'
    };
  }

  /**
   * 处理自定义范围
   */
  private processCustomRange(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): CrochetRangeResult {
    const { crochetRange } = settings;
    const { shape = 'rectangle', width: rangeWidth, height: rangeHeight } = crochetRange;

    // 提取范围内的颜色网格
    const croppedGrid = this.extractRangeGrid(colorGrid, settings);

    // 使用完整范围的逻辑处理裁剪后的网格
    return this.processFullRange(croppedGrid, settings);
  }

  /**
   * 提取指定范围内的颜色网格
   */
  private extractRangeGrid(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): (YarnColor | null)[][] {
    const { crochetRange } = settings;
    const { shape, width: rangeWidth, height: rangeHeight } = crochetRange;
    const { width: fullWidth, height: fullHeight } = settings;

    if (shape === 'circle') {
      return this.extractCircularGrid(colorGrid, settings);
    } else if (shape === 'ellipse') {
      return this.extractEllipticalGrid(colorGrid, settings);
    } else {
      // 矩形 - 从中心裁剪
      const startX = Math.floor((fullWidth - (rangeWidth || fullWidth)) / 2);
      const startY = Math.floor((fullHeight - (rangeHeight || fullHeight)) / 2);
      const endX = startX + (rangeWidth || fullWidth);
      const endY = startY + (rangeHeight || fullHeight);

      return colorGrid.slice(startY, endY).map(row =>
        row.slice(startX, endX)
      );
    }
  }

  /**
   * 提取圆形网格
   */
  private extractCircularGrid(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): (YarnColor | null)[][] {
    const { crochetRange } = settings;
    const { radius = Math.min(settings.width, settings.height) / 2 } = crochetRange;
    const centerX = crochetRange.centerX || settings.width / 2;
    const centerY = crochetRange.centerY || settings.height / 2;

    const result: (YarnColor | null)[][] = [];

    for (let y = 0; y < settings.height; y++) {
      const row: (YarnColor | null)[] = [];
      for (let x = 0; x < settings.width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        if (distance <= radius) {
          row.push(colorGrid[y][x]);
        } else {
          row.push(null);
        }
      }
      result.push(row);
    }

    return result;
  }

  /**
   * 提取椭圆形网格
   */
  private extractEllipticalGrid(
    colorGrid: (YarnColor | null)[][],
    settings: PatternSettings
  ): (YarnColor | null)[][] {
    const { crochetRange } = settings;
    const { width: rangeWidth = settings.width, height: rangeHeight = settings.height } = crochetRange;
    const centerX = settings.width / 2;
    const centerY = settings.height / 2;

    const result: (YarnColor | null)[][] = [];

    for (let y = 0; y < settings.height; y++) {
      const row: (YarnColor | null)[] = [];
      for (let x = 0; x < settings.width; x++) {
        const ellipseX = (x - centerX) / (rangeWidth / 2);
        const ellipseY = (y - centerY) / (rangeHeight / 2);

        if (ellipseX * ellipseX + ellipseY * ellipseY <= 1) {
          row.push(colorGrid[y][x]);
        } else {
          row.push(null);
        }
      }
      result.push(row);
    }

    return result;
  }

  /**
   * 生成圈钩织指令
   */
  private generateRoundInstructions(round: number, targetRadius: number, settings: PatternSettings): string {
    const stitchCount = this.calculateRoundStitchCount(round);
    const incCount = round === 1 ? 0 : 6; // 每圈加6针

    if (round === 1) {
      return `${stitchCount}针短针 (环形起针)`;
    } else {
      return `[${stitchCount - incCount}针短针, ${incCount}针加针] * ${stitchCount}针`;
    }
  }

  /**
   * 计算圈针数
   */
  private calculateRoundStitchCount(round: number): number {
    return 6 * round; // 每圈6的倍数
  }

  /**
   * 计算总针数
   */
  private calculateTotalStitches(instructions: CrochetInstruction[]): number {
    return instructions.reduce((total, instruction) => total + instruction.stitchCount, 0);
  }

  /**
   * 生成换色指令
   */
  private generateColorChangeInstruction(
    row: (YarnColor | null)[],
    currentColor: YarnColor | null,
    colorChanges: any[]
  ): string {
    const segments: string[] = [];
    let currentSegmentStart = 0;
    let currentSegmentColor = currentColor;

    row.forEach((cell, index) => {
      if (cell && cell !== currentSegmentColor) {
        if (currentSegmentColor) {
          const segmentLength = index - currentSegmentStart;
          if (segmentLength > 0) {
            segments.push(`${segmentLength}针${currentSegmentColor.name}`);
          }
        }
        currentSegmentStart = index;
        currentSegmentColor = cell;
      }
    });

    // 添加最后一个段
    if (currentSegmentColor) {
      const segmentLength = row.length - currentSegmentStart;
      if (segmentLength > 0) {
        segments.push(`${segmentLength}针${currentSegmentColor.name}`);
      }
    }

    return segments.join(', ');
  }

  /**
   * 获取技法名称
   */
  private getTechniqueName(crochetRange: any): string {
    const techniques = [];

    if (crochetRange.startMethod === 'magic-ring') {
      techniques.push('环形起针');
    }

    if (crochetRange.direction === 'rounds') {
      techniques.push('圈钩织');
    } else {
      techniques.push('行钩织');
    }

    if (crochetRange.shape === 'circle') {
      techniques.push('圆形图案');
    }

    return techniques.join(' + ');
  }
}

export const crochetRangeProcessor = new CrochetRangeProcessor();
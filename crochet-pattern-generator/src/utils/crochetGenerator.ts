import { YarnColor, CrochetInstruction, ColorChange, StitchType } from '../types';

export class CrochetGenerator {

  /**
   * 生成编织指令
   */
  generateInstructions(
    colorGrid: YarnColor[][],
    stitchType: StitchType,
    stitchesPerRow: number
  ): CrochetInstruction[] {
    const instructions: CrochetInstruction[] = [];
    const rows = colorGrid.length;

    for (let row = 0; row < rows; row++) {
      const instruction = this.generateRowInstruction(
        colorGrid[row],
        row + 1,
        stitchType,
        stitchesPerRow
      );
      instructions.push(instruction);
    }

    return instructions;
  }

  /**
   * 为单行生成指令
   */
  private generateRowInstruction(
    row: YarnColor[],
    rowNum: number,
    stitchType: StitchType,
    stitchesPerRow: number
  ): CrochetInstruction {
    const colorChanges: ColorChange[] = [];
    let currentColor = row[0];
    let instructionParts: string[] = [];

    // 分析颜色变化
    for (let i = 0; i < stitchesPerRow && i < row.length; i++) {
      if (row[i].id !== currentColor.id) {
        // 颜色变化
        colorChanges.push({
          stitch: i,
          fromColor: currentColor,
          toColor: row[i]
        });
        currentColor = row[i];
      }
    }

    // 生成编织指令
    currentColor = row[0];
    let currentStitchCount = 0;

    for (let i = 0; i < stitchesPerRow && i < row.length; i++) {
      if (row[i].id === currentColor.id) {
        currentStitchCount++;
      } else {
        // 添加当前颜色的指令
        if (currentStitchCount > 0) {
          instructionParts.push(
            `${currentStitchCount}${this.getStitchAbbreviation(stitchType)}(${currentColor.name})`
          );
        }

        currentColor = row[i];
        currentStitchCount = 1;
      }
    }

    // 添加最后一段指令
    if (currentStitchCount > 0) {
      instructionParts.push(
        `${currentStitchCount}${this.getStitchAbbreviation(stitchType)}(${currentColor.name})`
      );
    }

    const instruction = instructionParts.join(', ');

    return {
      row: rowNum,
      instructions: `第${rowNum}行: ${instruction}`,
      stitchCount: stitchesPerRow,
      colorChanges
    };
  }

  /**
   * 获取针法的缩写
   */
  private getStitchAbbreviation(stitchType: StitchType): string {
    switch (stitchType) {
      case 'single':
        return 'X'; // 短针
      case 'double':
        return 'V'; // 长针
      case 'half-double':
        return 'H'; // 中长针
      case 'treble':
        return 'T'; // 特长针
      case 'slip':
        return 'S'; // 引拔针
      case 'chain':
        return 'CH'; // 锁针
      default:
        return 'X';
    }
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

    const instructions = this.generateInstructions(colorGrid, stitchType, stitchesPerRow);
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
}

export const crochetGenerator = new CrochetGenerator();
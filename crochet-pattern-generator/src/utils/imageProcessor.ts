import { YarnColor, ImageUploadResult, PatternSettings } from '../types';
import { imageAnalyzer } from './imageAnalyzer';

// 预定义的毛线颜色调色板
export const YARN_COLOR_PALETTE: YarnColor[] = [
  { id: 'white', name: '白色', hexCode: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
  { id: 'cream', name: '米色', hexCode: '#F5F5DC', rgb: { r: 245, g: 245, b: 220 } },
  { id: 'beige', name: '米黄', hexCode: '#F5DEB3', rgb: { r: 245, g: 222, b: 179 } },
  { id: 'light-pink', name: '浅粉', hexCode: '#FFB6C1', rgb: { r: 255, g: 182, b: 193 } },
  { id: 'pink', name: '粉色', hexCode: '#FFC0CB', rgb: { r: 255, g: 192, b: 203 } },
  { id: 'red', name: '红色', hexCode: '#DC143C', rgb: { r: 220, g: 20, b: 60 } },
  { id: 'orange', name: '橙色', hexCode: '#FFA500', rgb: { r: 255, g: 165, b: 0 } },
  { id: 'yellow', name: '黄色', hexCode: '#FFD700', rgb: { r: 255, g: 215, b: 0 } },
  { id: 'light-green', name: '浅绿', hexCode: '#90EE90', rgb: { r: 144, g: 238, b: 144 } },
  { id: 'green', name: '绿色', hexCode: '#228B22', rgb: { r: 34, g: 139, b: 34 } },
  { id: 'light-blue', name: '浅蓝', hexCode: '#87CEEB', rgb: { r: 135, g: 206, b: 235 } },
  { id: 'blue', name: '蓝色', hexCode: '#4169E1', rgb: { r: 65, g: 105, b: 225 } },
  { id: 'purple', name: '紫色', hexCode: '#9370DB', rgb: { r: 147, g: 112, b: 219 } },
  { id: 'brown', name: '棕色', hexCode: '#8B4513', rgb: { r: 139, g: 69, b: 19 } },
  { id: 'gray', name: '灰色', hexCode: '#808080', rgb: { r: 128, g: 128, b: 128 } },
  { id: 'black', name: '黑色', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
];

export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
  }

  /**
   * 加载并处理图片 - 增强版本
   */
  async processImage(file: File, settings: PatternSettings): Promise<ImageUploadResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          let result: ImageUploadResult;

          if (settings.autoStitchPattern || settings.mixedStitches) {
            // 使用智能分析和针法生成
            result = await this.processImageWithSmartAnalysis(img, settings);
          } else {
            // 使用传统处理方式
            result = this.processImageElement(img, settings);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 智能分析和处理图片
   */
  private async processImageWithSmartAnalysis(
    img: HTMLImageElement,
    settings: PatternSettings
  ): Promise<ImageUploadResult> {
    try {
      // 使用智能分析器分析图片
      const analysisResult = await imageAnalyzer.analyzeImage(img, settings);

      // 将分析结果转换为ImageUploadResult格式
      return {
        originalImage: img,
        pixelatedData: analysisResult.extractedSubject,
        extractedColors: analysisResult.dominantColors,
        width: settings.width,
        height: settings.height,
        analysisResult // 保留分析结果用于后续处理
      };
    } catch (error) {
      console.warn('智能分析失败，回退到传统处理方式:', error);
      return this.processImageElement(img, settings);
    }
  }

  /**
   * 处理图片元素
   */
  private processImageElement(img: HTMLImageElement, settings: PatternSettings): ImageUploadResult {
    // 设置画布尺寸
    const { width, height } = settings;
    this.canvas.width = width;
    this.canvas.height = height;

    // 绘制并缩放图片
    this.ctx.drawImage(img, 0, 0, width, height);

    // 获取图像数据
    const imageData = this.ctx.getImageData(0, 0, width, height);

    // 提取颜色
    const extractedColors = this.extractColors(imageData, settings.maxColors, settings.removeBlackLines);

    return {
      originalImage: img,
      pixelatedData: imageData,
      extractedColors,
      width,
      height,
    };
  }

  /**
   * 从图像数据中提取主要颜色
   */
  private extractColors(imageData: ImageData, maxColors: number, removeBlackLines: boolean = false): YarnColor[] {
    const colorMap = new Map<string, { count: number; rgb: { r: number; g: number; b: number } }>();
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 统计颜色出现频率
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // 跳过透明像素

      // 检测并过滤黑色线条（如果启用）
      if (removeBlackLines && this.isBlackColor(r, g, b)) {
        // 将黑色像素替换为背景色或周边颜色
        const replacementColor = this.getReplacementColor(data, i, width, height);
        if (replacementColor) {
          data[i] = replacementColor.r;
          data[i + 1] = replacementColor.g;
          data[i + 2] = replacementColor.b;
        }
        continue; // 跳过黑色像素的颜色统计
      }

      // 简化颜色（减少颜色数量）
      const simplifiedR = Math.round(r / 32) * 32;
      const simplifiedG = Math.round(g / 32) * 32;
      const simplifiedB = Math.round(b / 32) * 32;

      const key = `${simplifiedR},${simplifiedG},${simplifiedB}`;
      const existing = colorMap.get(key);

      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, {
          count: 1,
          rgb: { r: simplifiedR, g: simplifiedG, b: simplifiedB }
        });
      }
    }

    // 按频率排序
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1].count - a[1].count);

    // 映射到最接近的毛线颜色并按频率分组
    const yarnColorGroups = new Map<string, { count: number; rgb: { r: number; g: number; b: number } }>();

    sortedColors.forEach(([_, colorData]) => {
      const closestYarnColor = this.findClosestYarnColor(colorData.rgb);
      const existing = yarnColorGroups.get(closestYarnColor.id);

      if (existing) {
        existing.count += colorData.count;
      } else {
        yarnColorGroups.set(closestYarnColor.id, {
          count: colorData.count,
          rgb: colorData.rgb
        });
      }
    });

    // 按频率排序并取前maxColors个最接近的毛线颜色
    const finalColors = Array.from(yarnColorGroups.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, maxColors)
      .map(([yarnColorId, _], index) => {
        const yarnColor = YARN_COLOR_PALETTE.find(c => c.id === yarnColorId)!;
        return {
          ...yarnColor,
          id: `${yarnColor.id}_${index}`,
        };
      });

    // 如果颜色不够，用最接近的剩余毛线颜色补充
    if (finalColors.length < maxColors) {
      const usedColorIds = new Set(finalColors.map(c => c.id.split('_')[0]));
      const remainingColors = YARN_COLOR_PALETTE.filter(c => !usedColorIds.has(c.id));

      // 按与主要颜色的平均距离排序，选择差异最大的颜色
      const avgRgb = this.calculateAverageRgb(finalColors);
      remainingColors.sort((a, b) =>
        this.colorDistance(b.rgb, avgRgb) - this.colorDistance(a.rgb, avgRgb)
      );

      for (let i = finalColors.length; i < maxColors && i - finalColors.length < remainingColors.length; i++) {
        finalColors.push({
          ...remainingColors[i - finalColors.length],
          id: `${remainingColors[i - finalColors.length].id}_${i}`
        });
      }
    }

    return finalColors.slice(0, maxColors);
  }

  /**
   * 找到最接近的毛线颜色
   */
  private findClosestYarnColor(rgb: { r: number; g: number; b: number }): YarnColor {
    let minDistance = Infinity;
    let closestColor = YARN_COLOR_PALETTE[0];

    for (const yarnColor of YARN_COLOR_PALETTE) {
      const distance = this.calculateColorDistance(rgb, yarnColor.rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = yarnColor;
      }
    }

    return closestColor;
  }

  /**
   * 计算两个颜色之间的欧几里得距离
   */
  private calculateColorDistance(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
  }

  /**
   * 检测是否为黑色或深灰色（线条颜色）
   */
  private isBlackColor(r: number, g: number, b: number): boolean {
    // 检测黑色和深灰色
    const brightness = (r + g + b) / 3;
    return brightness < 50; // 亮度阈值，可以根据需要调整
  }

  /**
   * 获取替换颜色（用于替换黑色线条）
   */
  private getReplacementColor(
    data: Uint8ClampedArray,
    index: number,
    width: number,
    height: number
  ): { r: number; g: number; b: number } | null {
    const x = (index / 4) % width;
    const y = Math.floor((index / 4) / width);

    // 寻找周边的非黑色像素
    const searchRadius = 3; // 搜索半径
    const surroundingColors: { r: number; g: number; b: number }[] = [];

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIndex = (ny * width + nx) * 4;
          const nr = data[neighborIndex];
          const ng = data[neighborIndex + 1];
          const nb = data[neighborIndex + 2];
          const na = data[neighborIndex + 3];

          if (na >= 128 && !this.isBlackColor(nr, ng, nb)) {
            surroundingColors.push({ r: nr, g: ng, b: nb });
          }
        }
      }
    }

    if (surroundingColors.length === 0) {
      // 如果没有找到周边颜色，返回白色作为默认
      return { r: 255, g: 255, b: 255 };
    }

    // 计算周边颜色的平均值
    const avgColor = surroundingColors.reduce(
      (acc, color) => ({
        r: acc.r + color.r / surroundingColors.length,
        g: acc.g + color.g / surroundingColors.length,
        b: acc.b + color.b / surroundingColors.length
      }),
      { r: 0, g: 0, b: 0 }
    );

    return {
      r: Math.round(avgColor.r),
      g: Math.round(avgColor.g),
      b: Math.round(avgColor.b)
    };
  }

  /**
   * 将图像数据转换为颜色网格
   */
  createColorGrid(
    imageData: ImageData,
    colors: YarnColor[],
    width: number,
    height: number
  ): YarnColor[][] {
    if (colors.length === 0) {
      throw new Error('颜色列表不能为空');
    }

    const grid: YarnColor[][] = [];
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      const row: YarnColor[] = [];
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) {
          // 透明或接近透明的像素，使用第一个可用颜色
          row.push(colors[0]);
        } else {
          const rgb = { r, g, b };

          // 在提供的颜色中找到最接近的颜色，不引入新颜色
          let closestColor = colors[0];
          let minDistance = Number.MAX_VALUE;

          for (const color of colors) {
            const distance = this.colorDistance(rgb, color.rgb);
            if (distance < minDistance) {
              minDistance = distance;
              closestColor = color;
            }
          }

          row.push(closestColor);
        }
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * 简化颜色网格（减少颜色变化）
   */
  simplifyColorGrid(
    grid: YarnColor[][],
    colors: YarnColor[],
    simplificationLevel: number
  ): YarnColor[][] {
    if (simplificationLevel === 0) return grid;

    const height = grid.length;
    const width = grid[0]?.length || 0;
    const simplified: YarnColor[][] = [];

    for (let y = 0; y < height; y++) {
      simplified[y] = [];
      for (let x = 0; x < width; x++) {
        let color = grid[y][x];

        // 检查周围的像素
        const neighbors = this.getNeighbors(grid, x, y);
        const colorCounts = new Map<string, number>();

        neighbors.forEach(neighbor => {
          const key = neighbor.id;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        });

        // 如果周围有更常见的颜色，且有足够的简化程度，则采用
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1]);

        if (sortedColors.length > 1 && sortedColors[0][1] > neighbors.length * simplificationLevel) {
          const dominantColorId = sortedColors[0][0];
          color = grid[y][x];
          // 简化逻辑：如果当前颜色不是主导颜色，则改为主导颜色
          if (color.id.split('_')[0] !== dominantColorId) {
            const dominantColor = colors.find(c => c.id.split('_')[0] === dominantColorId);
            if (dominantColor) color = dominantColor;
          }
        }

        simplified[y][x] = color;
      }
    }

    return simplified;
  }

  private getNeighbors(grid: YarnColor[][], x: number, y: number): YarnColor[] {
    const neighbors: YarnColor[] = [];
    const height = grid.length;
    const width = grid[0]?.length || 0;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push(grid[ny][nx]);
      }
    }

    return neighbors;
  }

  /**
   * 计算两个颜色之间的欧几里得距离
   */
  private colorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * 计算一组颜色的平均RGB值
   */
  private calculateAverageRgb(colors: YarnColor[]): { r: number; g: number; b: number } {
    if (colors.length === 0) {
      return { r: 128, g: 128, b: 128 }; // 默认灰色
    }

    const sum = colors.reduce((acc, color) => ({
      r: acc.r + color.rgb.r,
      g: acc.g + color.rgb.g,
      b: acc.b + color.rgb.b
    }), { r: 0, g: 0, b: 0 });

    return {
      r: Math.round(sum.r / colors.length),
      g: Math.round(sum.g / colors.length),
      b: Math.round(sum.b / colors.length)
    };
  }
}

export const imageProcessor = new ImageProcessor();
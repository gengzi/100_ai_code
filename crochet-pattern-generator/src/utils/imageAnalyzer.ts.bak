import { YarnColor, PatternSettings } from '../types';

// 图像分析结果
export interface ImageAnalysisResult {
  originalImage: HTMLImageElement;
  subjectMask: ImageData;          // 主体蒙版
  extractedSubject: ImageData;     // 提取的主体
  backgroundRemoved: ImageData;    // 去除背景后的图像
  shapeComplexity: 'simple' | 'moderate' | 'complex';
  dominantColors: YarnColor[];
  textureRegions: TextureRegion[]; // 纹理区域
  edges: EdgePoint[];              // 边缘点
  recommendedStitches: StitchRecommendation[];
}

// 纹理区域
export interface TextureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  textureType: 'flat' | 'detailed' | 'gradient' | 'textured';
  recommendedStitch: string;
  complexity: number; // 0-1
}

// 边缘点
export interface EdgePoint {
  x: number;
  y: number;
  edgeStrength: number; // 边缘强度 0-1
  direction: number;    // 边缘方向（弧度）
}

// 针法推荐
export interface StitchRecommendation {
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  stitchType: string;
  reason: string;
  confidence: number; // 0-1
}

export class ImageAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
  }

  /**
   * 分析图像并提取主体
   */
  async analyzeImage(
    image: HTMLImageElement,
    settings: PatternSettings
  ): Promise<ImageAnalysisResult> {
    // 设置canvas尺寸
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    // 绘制原始图像
    this.ctx.drawImage(image, 0, 0);
    const originalImageData = this.ctx.getImageData(0, 0, image.width, image.height);

    // 1. 创建主体蒙版
    const subjectMask = this.createSubjectMask(originalImageData);

    // 2. 提取主体
    const extractedSubject = this.extractSubject(originalImageData, subjectMask);

    // 3. 分析形状复杂度
    const shapeComplexity = this.analyzeShapeComplexity(subjectMask);

    // 4. 提取纹理区域
    const textureRegions = this.analyzeTextureRegions(extractedSubject);

    // 5. 检测边缘
    const edges = this.detectEdges(extractedSubject);

    // 6. 推荐针法
    const recommendedStitches = this.recommendStitches(
      extractedSubject,
      textureRegions,
      edges,
      shapeComplexity,
      settings
    );

    // 7. 提取主要颜色
    const dominantColors = this.extractDominantColors(extractedSubject, settings.maxColors);

    return {
      originalImage: image,
      subjectMask,
      extractedSubject,
      backgroundRemoved: extractedSubject,
      shapeComplexity,
      dominantColors,
      textureRegions,
      edges,
      recommendedStitches
    };
  }

  /**
   * 创建主体蒙版 - 使用保守算法只移除外围背景
   */
  private createSubjectMask(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const maskData = new Uint8ClampedArray(width * height * 4);

    // 1. 估算主要背景色
    const backgroundColor = this.estimateBackgroundColor(imageData);
    const backgroundTolerance = 60; // 背景色容忍度

    // 2. 创建基于背景色的蒙版，只移除明显的背景
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const maskIndex = i;

        // 获取当前像素颜色
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // const a = data[i + 3]; // 暂时不需要透明度信息

        // 计算与背景色的差异
        const colorDiff = Math.sqrt(
          Math.pow(r - backgroundColor[0], 2) +
          Math.pow(g - backgroundColor[1], 2) +
          Math.pow(b - backgroundColor[2], 2)
        );

        // 保守判断：只有在背景色差异很小且位于边缘时才认为是背景
        const isEdge = x < 5 || x >= width - 5 || y < 5 || y >= height - 5;
        const isBackground = colorDiff < backgroundTolerance && (isEdge || colorDiff < backgroundTolerance * 0.5);

        // 默认保留所有像素为前景，只移除明显的背景
        maskData[maskIndex] = !isBackground ? 255 : 0;
        maskData[maskIndex + 1] = !isBackground ? 255 : 0;
        maskData[maskIndex + 2] = !isBackground ? 255 : 0;
        maskData[maskIndex + 3] = 255;
      }
    }

    return new ImageData(new Uint8ClampedArray(maskData), width, height);
  }

  /**
   * 提取主体
   */
  private extractSubject(imageData: ImageData, mask: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const result = new ImageData(width, height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskValue = mask.data[i];

      if (maskValue > 128) {
        // 主体区域，保留原颜色
        result.data[i] = imageData.data[i];
        result.data[i + 1] = imageData.data[i + 1];
        result.data[i + 2] = imageData.data[i + 2];
        result.data[i + 3] = imageData.data[i + 3];
      } else {
        // 背景区域，设为透明
        result.data[i] = 255;
        result.data[i + 1] = 255;
        result.data[i + 2] = 255;
        result.data[i + 3] = 0;
      }
    }

    return result;
  }

  /**
   * 检测简单边缘
   */
  private detectSimpleEdges(imageData: ImageData): Float32Array {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const edges = new Float32Array(width * height);

    // Sobel边缘检测
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        // 应用Sobel算子
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);

            gx += gray * sobelX[kernelIndex];
            gy += gray * sobelY[kernelIndex];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude / 255; // 归一化到0-1
      }
    }

    return edges;
  }

  /**
   * 估算背景颜色
   */
  private estimateBackgroundColor(imageData: ImageData): [number, number, number] {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 采样边缘像素来估算背景色
    const edgePixels: number[][] = [];

    // 上边缘
    for (let x = 0; x < width; x++) {
      const i = (x * 4);
      edgePixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // 下边缘
    for (let x = 0; x < width; x++) {
      const i = ((height - 1) * width + x) * 4;
      edgePixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // 左边缘
    for (let y = 0; y < height; y++) {
      const i = (y * width * 4);
      edgePixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // 右边缘
    for (let y = 0; y < height; y++) {
      const i = (y * width + width - 1) * 4;
      edgePixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // 计算平均颜色
    const avgColor = [0, 0, 0];
    edgePixels.forEach(color => {
      avgColor[0] += color[0];
      avgColor[1] += color[1];
      avgColor[2] += color[2];
    });

    avgColor[0] = Math.round(avgColor[0] / edgePixels.length);
    avgColor[1] = Math.round(avgColor[1] / edgePixels.length);
    avgColor[2] = Math.round(avgColor[2] / edgePixels.length);

    return avgColor as [number, number, number];
  }

  /**
   * 形态学清理
   */
  // private morphologyCleanup(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  //   const result = new Uint8ClampedArray(data);

  //   // 简单的开运算（去除小噪点）
  //   // 先腐蚀
  //   for (let y = 1; y < height - 1; y++) {
  //     for (let x = 1; x < width - 1; x++) {
  //       const i = (y * width + x) * 4;

  //       let shouldKeep = true;
  //       for (let dy = -1; dy <= 1; dy++) {
  //         for (let dx = -1; dx <= 1; dx++) {
  //           const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
  //           if (data[neighborIndex] < 128) {
  //             shouldKeep = false;
  //             break;
  //           }
  //         }
  //         if (!shouldKeep) break;
  //       }

  //       if (!shouldKeep) {
  //         result[i] = result[i + 1] = result[i + 2] = 0;
  //       }
  //     }
  //   }

  //   // 再膨胀
  //   for (let y = 1; y < height - 1; y++) {
  //     for (let x = 1; x < width - 1; x++) {
  //       const i = (y * width + x) * 4;

  //       let shouldExpand = false;
  //       for (let dy = -1; dy <= 1; dy++) {
  //         for (let dx = -1; dx <= 1; dx++) {
  //           const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
  //           if (result[neighborIndex] >= 128) {
  //             shouldExpand = true;
  //             break;
  //           }
  //         }
  //         if (shouldExpand) break;
  //       }

  //       if (shouldExpand) {
  //         result[i] = result[i + 1] = result[i + 2] = 255;
  //       }
  //     }
  //   }

  //   return result;
  // }

  /**
   * 分析形状复杂度
   */
  private analyzeShapeComplexity(mask: ImageData): 'simple' | 'moderate' | 'complex' {
    const data = mask.data;
    let edgePixels = 0;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 128) {
        totalPixels++;
        // 简单的边缘检测
        const x = (i / 4) % mask.width;
        const y = Math.floor((i / 4) / mask.width);

        // 检查邻居
        let hasBackgroundNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < mask.width && ny >= 0 && ny < mask.height) {
              const neighborIndex = (ny * mask.width + nx) * 4;
              if (data[neighborIndex] < 128) {
                hasBackgroundNeighbor = true;
                break;
              }
            }
          }
          if (hasBackgroundNeighbor) break;
        }

        if (hasBackgroundNeighbor) edgePixels++;
      }
    }

    const edgeRatio = edgePixels / totalPixels;

    if (edgeRatio < 0.1) return 'simple';
    if (edgeRatio < 0.25) return 'moderate';
    return 'complex';
  }

  /**
   * 分析纹理区域
   */
  private analyzeTextureRegions(imageData: ImageData): TextureRegion[] {
    const regions: TextureRegion[] = [];
    const width = imageData.width;
    const height = imageData.height;
    const regionSize = 32; // 分析区域大小

    for (let y = 0; y < height; y += regionSize) {
      for (let x = 0; x < width; x += regionSize) {
        const regionWidth = Math.min(regionSize, width - x);
        const regionHeight = Math.min(regionSize, height - y);

        // 分析区域的纹理特征
        const complexity = this.analyzeRegionTexture(imageData, x, y, regionWidth, regionHeight);
        const textureType = this.classifyTexture(complexity);
        const recommendedStitch = this.recommendStitchForTexture(textureType);

        regions.push({
          x,
          y,
          width: regionWidth,
          height: regionHeight,
          textureType,
          recommendedStitch,
          complexity
        });
      }
    }

    return regions;
  }

  /**
   * 分析区域纹理
   */
  private analyzeRegionTexture(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const data = imageData.data;
    let colorVariance = 0;
    const colors: number[][] = [];

    // 收集区域内的颜色
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const i = ((y + dy) * imageData.width + (x + dx)) * 4;
        if (data[i + 3] > 0) { // 只处理不透明像素
          colors.push([data[i], data[i + 1], data[i + 2]]);
        }
      }
    }

    if (colors.length < 2) return 0;

    // 计算颜色方差
    const avgColor = colors.reduce((sum, color) => [
      sum[0] + color[0] / colors.length,
      sum[1] + color[1] / colors.length,
      sum[2] + color[2] / colors.length
    ], [0, 0, 0]);

    colorVariance = colors.reduce((sum, color) => {
      const diff = Math.sqrt(
        Math.pow(color[0] - avgColor[0], 2) +
        Math.pow(color[1] - avgColor[1], 2) +
        Math.pow(color[2] - avgColor[2], 2)
      );
      return sum + diff;
    }, 0) / colors.length;

    return Math.min(colorVariance / 100, 1); // 归一化
  }

  /**
   * 分类纹理类型
   */
  private classifyTexture(complexity: number): 'flat' | 'detailed' | 'gradient' | 'textured' {
    if (complexity < 0.1) return 'flat';
    if (complexity < 0.3) return 'gradient';
    if (complexity < 0.6) return 'detailed';
    return 'textured';
  }

  /**
   * 为纹理推荐针法
   */
  private recommendStitchForTexture(textureType: string): string {
    const recommendations: {[key: string]: string} = {
      flat: 'single',        // 平滑区域用短针
      gradient: 'half-double', // 渐变区域用中长针
      detailed: 'double',    // 细节区域用长针
      textured: 'shell'      // 纹理区域用贝壳针
    };

    return recommendations[textureType] || 'single';
  }

  /**
   * 检测边缘点
   */
  private detectEdges(imageData: ImageData): EdgePoint[] {
    const edges: EdgePoint[] = [];
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const edgeData = this.detectSimpleEdges(imageData);

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const strength = edgeData[y * width + x];
        if (strength > 0.1) {
          // 计算边缘方向
          const direction = this.calculateEdgeDirection(data, x, y, width);

          edges.push({
            x,
            y,
            edgeStrength: strength,
            direction
          });
        }
      }
    }

    return edges;
  }

  /**
   * 计算边缘方向
   */
  private calculateEdgeDirection(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    // 简单的梯度计算
    const centerIndex = (y * width + x) * 4;
    const centerGray = (data[centerIndex] + data[centerIndex + 1] + data[centerIndex + 2]) / 3;

    const rightIndex = (y * width + x + 1) * 4;
    const rightGray = (data[rightIndex] + data[rightIndex + 1] + data[rightIndex + 2]) / 3;

    const bottomIndex = ((y + 1) * width + x) * 4;
    const bottomGray = (data[bottomIndex] + data[bottomIndex + 1] + data[bottomIndex + 2]) / 3;

    const gx = rightGray - centerGray;
    const gy = bottomGray - centerGray;

    return Math.atan2(gy, gx);
  }

  /**
   * 推荐针法
   */
  private recommendStitches(
    _imageData: ImageData,
    textureRegions: TextureRegion[],
    edges: EdgePoint[],
    _shapeComplexity: 'simple' | 'moderate' | 'complex',
    _settings: PatternSettings
  ): StitchRecommendation[] {
    const recommendations: StitchRecommendation[] = [];

    // 根据纹理区域推荐
    textureRegions.forEach(region => {
      recommendations.push({
        region: {
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height
        },
        stitchType: region.recommendedStitch,
        reason: `${region.textureType}纹理区域推荐使用${region.recommendedStitch}`,
        confidence: 0.8
      });
    });

    // 根据边缘推荐减针/增针
    edges.forEach(edge => {
      if (edge.edgeStrength > 0.5) {
        recommendations.push({
          region: {
            x: Math.max(0, edge.x - 5),
            y: Math.max(0, edge.y - 5),
            width: 10,
            height: 10
          },
          stitchType: 'decrease',
          reason: '边缘区域适合使用减针塑造形状',
          confidence: 0.6
        });
      }
    });

    return recommendations;
  }

  /**
   * 提取主要颜色
   */
  private extractDominantColors(imageData: ImageData, maxColors: number): YarnColor[] {
    const data = imageData.data;
    const colorMap = new Map<string, { count: number; rgb: [number, number, number] }>();

    // 统计颜色频率
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) { // 只处理不透明像素
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;

        const key = `${r},${g},${b}`;
        const existing = colorMap.get(key);

        if (existing) {
          existing.count++;
        } else {
          colorMap.set(key, {
            count: 1,
            rgb: [r, g, b]
          });
        }
      }
    }

    // 按频率排序
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, maxColors);

    // 转换为YarnColor格式
    return sortedColors.map(([_, colorData], index) => ({
      id: `dominant_${index}`,
      name: `主色调${index + 1}`,
      hexCode: `#${colorData.rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`,
      rgb: { r: colorData.rgb[0], g: colorData.rgb[1], b: colorData.rgb[2] }
    }));
  }

  /**
   * 计算颜色距离
   */
  // private colorDistance(color1: number[], color2: number[]): number {
  //   return Math.sqrt(
  //     Math.pow(color1[0] - color2[0], 2) +
  //     Math.pow(color1[1] - color2[1], 2) +
  //     Math.pow(color1[2] - color2[2], 2)
  //   );
  // }
}

export const imageAnalyzer = new ImageAnalyzer();
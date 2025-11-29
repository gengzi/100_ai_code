import { YarnColor, ImageUploadResult, PatternSettings } from '../types';

export interface Image3DResult {
  originalImage: HTMLImageElement;
  depthMap: ImageData;           // 深度图
  normalMap: ImageData;          // 法线贴图
  layers: ImageLayer[];          // 3D分层
  extractedColors: YarnColor[];
  width: number;
  height: number;
  depth: number;                 // 3D深度层数
}

export interface ImageLayer {
  id: number;
  depth: number;                 // 深度层级 (0-255)
  imageData: ImageData;          // 该层的图像数据
  mask: ImageData;               // 该层的遮罩
  prominence: number;            // 该层的显著度
  color: YarnColor;              // 主导颜色
}

export interface Depth3DSettings {
  depthIntensity: number;        // 深度强度 (0.1-2.0)
  layerCount: number;            // 分层数量 (3-20)
  smoothing: boolean;            // 是否平滑深度
  edgeEnhancement: boolean;      // 是否增强边缘
  colorDepth: boolean;           // 是否基于颜色生成深度
  contrast: number;              // 对比度 (0.5-2.0)
  brightness: number;            // 亮度 (0.5-1.5)
}

export class Image3DProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private depthCanvas: HTMLCanvasElement;
  private depthCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.depthCanvas = document.createElement('canvas');
    this.depthCtx = this.depthCanvas.getContext('2d')!;
  }

  /**
   * 处理图片生成3D效果
   */
  async process3DImage(file: File, settings: PatternSettings, depth3DSettings: Depth3DSettings): Promise<Image3DResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const result = this.process3DImageElement(img, settings, depth3DSettings);
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
   * 处理图片元素生成3D效果
   */
  private process3DImageElement(img: HTMLImageElement, settings: PatternSettings, depth3DSettings: Depth3DSettings): Image3DResult {
    const { width, height } = settings;

    // 设置画布尺寸
    this.canvas.width = width;
    this.canvas.height = height;
    this.depthCanvas.width = width;
    this.depthCanvas.height = height;

    // 绘制原图
    this.ctx.drawImage(img, 0, 0, width, height);
    let imageData = this.ctx.getImageData(0, 0, width, height);

    // 应用图像增强
    imageData = this.enhanceImage(imageData, depth3DSettings);

    // 生成深度图
    const depthMap = this.generateDepthMap(imageData, depth3DSettings);

    // 生成法线贴图
    const normalMap = this.generateNormalMap(depthMap);

    // 生成3D分层
    const layers = this.generate3DLayers(imageData, depthMap, depth3DSettings);

    // 提取颜色
    const extractedColors = this.extractColorsFromLayers(layers, settings.maxColors);

    return {
      originalImage: img,
      depthMap,
      normalMap,
      layers,
      extractedColors,
      width,
      height,
      depth: depth3DSettings.layerCount
    };
  }

  /**
   * 图像增强处理
   */
  private enhanceImage(imageData: ImageData, settings: Depth3DSettings): ImageData {
    const data = imageData.data;
    const newImageData = new ImageData(imageData.width, imageData.height);
    const newData = newImageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // 应用对比度和亮度调整
      let newR = r * settings.contrast * settings.brightness;
      let newG = g * settings.contrast * settings.brightness;
      let newB = b * settings.contrast * settings.brightness;

      // 限制在0-255范围内
      newR = Math.max(0, Math.min(255, newR));
      newG = Math.max(0, Math.min(255, newG));
      newB = Math.max(0, Math.min(255, newB));

      newData[i] = newR;
      newData[i + 1] = newG;
      newData[i + 2] = newB;
      newData[i + 3] = a;
    }

    return newImageData;
  }

  /**
   * 生成深度图
   */
  private generateDepthMap(imageData: ImageData, settings: Depth3DSettings): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const depthMap = new ImageData(width, height);
    const data = imageData.data;
    const depthData = depthMap.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        let depth = 0;

        if (settings.colorDepth) {
          // 基于颜色的深度
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;
          depth = (255 - brightness) / 255;
        } else {
          // 基于边缘检测的深度
          depth = this.calculateEdgeDepth(x, y, imageData);
        }

        // 应用强度和层数映射
        const layerDepth = Math.floor(depth * settings.depthIntensity * 255);
        const clampedDepth = Math.max(0, Math.min(255, layerDepth));

        // 深度图存储为灰度值
        const depthIdx = (y * width + x) * 4;
        depthData[depthIdx] = clampedDepth;
        depthData[depthIdx + 1] = clampedDepth;
        depthData[depthIdx + 2] = clampedDepth;
        depthData[depthIdx + 3] = 255;
      }
    }

    if (settings.smoothing) {
      return this.smoothDepthMap(depthMap);
    }

    return depthMap;
  }

  /**
   * 计算基于边缘的深度
   */
  private calculateEdgeDepth(x: number, y: number, imageData: ImageData): number {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      return 0.5; // 边界默认中等深度
    }

    // Sobel边缘检测
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];

    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];

    let gx = 0, gy = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const idx = (ny * width + nx) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        gx += brightness * sobelX[dy + 1][dx + 1];
        gy += brightness * sobelY[dy + 1][dx + 1];
      }
    }

    const magnitude = Math.sqrt(gx * gx + gy * gy);
    return Math.min(1.0, magnitude / 255);
  }

  /**
   * 平滑深度图
   */
  private smoothDepthMap(depthMap: ImageData): ImageData {
    const width = depthMap.width;
    const height = depthMap.height;
    const smoothed = new ImageData(width, height);
    const data = depthMap.data;
    const smoothData = smoothed.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        let count = 0;

        // 3x3高斯模糊
        const kernel = [
          [1, 2, 1],
          [2, 4, 2],
          [1, 2, 1]
        ];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            const idx = (ny * width + nx) * 4;
            const weight = kernel[dy + 1][dx + 1];

            sum += data[idx] * weight;
            count += weight;
          }
        }

        const smoothedValue = sum / count;
        const idx = (y * width + x) * 4;

        smoothData[idx] = smoothedValue;
        smoothData[idx + 1] = smoothedValue;
        smoothData[idx + 2] = smoothedValue;
        smoothData[idx + 3] = 255;
      }
    }

    return smoothed;
  }

  /**
   * 生成法线贴图
   */
  private generateNormalMap(depthMap: ImageData): ImageData {
    const width = depthMap.width;
    const height = depthMap.height;
    const normalMap = new ImageData(width, height);
    const depthData = depthMap.data;
    const normalData = normalMap.data;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // 计算深度梯度
        const dx = depthData[((y * width + x + 1) * 4)] - depthData[((y * width + x - 1) * 4)];
        const dy = depthData[(((y + 1) * width + x) * 4)] - depthData[(((y - 1) * width + x) * 4)];

        // 归一化
        const scale = 1.0 / 128.0;
        const nx = -dx * scale;
        const ny = -dy * scale;
        const nz = 1.0;

        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const normalizedX = (nx / length + 1.0) * 127.5;
        const normalizedY = (ny / length + 1.0) * 127.5;
        const normalizedZ = (nz / length + 1.0) * 127.5;

        normalData[idx] = normalizedX;
        normalData[idx + 1] = normalizedY;
        normalData[idx + 2] = normalizedZ;
        normalData[idx + 3] = 255;
      }
    }

    return normalMap;
  }

  /**
   * 生成3D分层
   */
  private generate3DLayers(imageData: ImageData, depthMap: ImageData, settings: Depth3DSettings): ImageLayer[] {
    const layers: ImageLayer[] = [];
    const width = imageData.width;
    const height = imageData.height;

    // 根据深度值创建分层
    for (let layer = 0; layer < settings.layerCount; layer++) {
      const threshold = (layer + 1) * 255 / settings.layerCount;
      const layerData = new ImageData(width, height);
      const maskData = new ImageData(width, height);

      const imageDataArr = imageData.data;
      const depthDataArr = depthMap.data;
      const layerDataArr = layerData.data;
      const maskDataArr = maskData.data;

      let pixelCount = 0;
      let totalR = 0, totalG = 0, totalB = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const depthValue = depthDataArr[idx];

          if (depthValue <= threshold) {
            // 复制像素
            layerDataArr[idx] = imageDataArr[idx];
            layerDataArr[idx + 1] = imageDataArr[idx + 1];
            layerDataArr[idx + 2] = imageDataArr[idx + 2];
            layerDataArr[idx + 3] = imageDataArr[idx + 3];

            // 设置遮罩
            maskDataArr[idx] = 255;
            maskDataArr[idx + 1] = 255;
            maskDataArr[idx + 2] = 255;
            maskDataArr[idx + 3] = 255;

            // 统计颜色
            totalR += imageDataArr[idx];
            totalG += imageDataArr[idx + 1];
            totalB += imageDataArr[idx + 2];
            pixelCount++;
          } else {
            // 透明
            layerDataArr[idx + 3] = 0;
            maskDataArr[idx + 3] = 0;
          }
        }
      }

      // 计算主导颜色
      const dominantR = pixelCount > 0 ? totalR / pixelCount : 128;
      const dominantG = pixelCount > 0 ? totalG / pixelCount : 128;
      const dominantB = pixelCount > 0 ? totalB / pixelCount : 128;

      // 找到最接近的毛线颜色
      const dominantYarnColor = this.findClosestYarnColor({
        r: Math.round(dominantR),
        g: Math.round(dominantG),
        b: Math.round(dominantB)
      });

      layers.push({
        id: layer,
        depth: layer,
        imageData: layerData,
        mask: maskData,
        prominence: pixelCount / (width * height),
        color: dominantYarnColor
      });
    }

    return layers.sort((a, b) => b.prominence - a.prominence);
  }

  /**
   * 找到最接近的毛线颜色
   */
  private findClosestYarnColor(rgb: { r: number; g: number; b: number }): YarnColor {
    // 这里使用一个简化的颜色调色板
    const yarnColors: YarnColor[] = [
      { id: 'white', name: '白色', hexCode: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
      { id: 'cream', name: '米色', hexCode: '#F5F5DC', rgb: { r: 245, g: 245, b: 220 } },
      { id: 'beige', name: '米黄', hexCode: '#F5DEB3', rgb: { r: 245, g: 222, b: 179 } },
      { id: 'pink', name: '粉色', hexCode: '#FFC0CB', rgb: { r: 255, g: 192, b: 203 } },
      { id: 'red', name: '红色', hexCode: '#DC143C', rgb: { r: 220, g: 20, b: 60 } },
      { id: 'orange', name: '橙色', hexCode: '#FFA500', rgb: { r: 255, g: 165, b: 0 } },
      { id: 'yellow', name: '黄色', hexCode: '#FFD700', rgb: { r: 255, g: 215, b: 0 } },
      { id: 'green', name: '绿色', hexCode: '#228B22', rgb: { r: 34, g: 139, b: 34 } },
      { id: 'blue', name: '蓝色', hexCode: '#4169E1', rgb: { r: 65, g: 105, b: 225 } },
      { id: 'purple', name: '紫色', hexCode: '#9370DB', rgb: { r: 147, g: 112, b: 219 } },
      { id: 'brown', name: '棕色', hexCode: '#8B4513', rgb: { r: 139, g: 69, b: 19 } },
      { id: 'gray', name: '灰色', hexCode: '#808080', rgb: { r: 128, g: 128, b: 128 } },
      { id: 'black', name: '黑色', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
    ];

    let minDistance = Infinity;
    let closestColor = yarnColors[0];

    for (const yarnColor of yarnColors) {
      const distance = this.calculateColorDistance(rgb, yarnColor.rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = yarnColor;
      }
    }

    return closestColor;
  }

  /**
   * 计算颜色距离
   */
  private calculateColorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /**
   * 从分层中提取颜色
   */
  private extractColorsFromLayers(layers: ImageLayer[], maxColors: number): YarnColor[] {
    const colors = new Map<string, { count: number; color: YarnColor }>();

    layers.forEach(layer => {
      const key = layer.color.id;
      const existing = colors.get(key);

      if (existing) {
        existing.count += layer.prominence;
      } else {
        colors.set(key, {
          count: layer.prominence,
          color: layer.color
        });
      }
    });

    // 按显著度排序并返回前N个
    return Array.from(colors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors)
      .map(item => item.color);
  }
}

export const image3DProcessor = new Image3DProcessor();
import { CrochetInstruction, StitchDetail, ColorChange, Image3DResult, ImageLayer, PatternSettings } from '../types';

export interface Crochet3DInstruction extends CrochetInstruction {
  depth: number;                    // 深度层级
  layerId: number;                  // 层级ID
  is3DElement: boolean;             // 是否为3D元素
  stitch3DType?: 'surface' | 'edge' | 'highlight'; // 3D针法类型
  depthTransition?: {
    fromLayer: number;
    toLayer: number;
    transitionType: 'gradual' | 'step' | 'overlap';
  };
}

export interface LayeredCrochetPattern {
  baseLayer: Crochet3DInstruction[];    // 基础层
  depthLayers: Crochet3DInstruction[][]; // 深度层
  layerInfo: LayerInfo[];               // 层级信息
  totalInstructions: Crochet3DInstruction[]; // 所有指令（按执行顺序）
}

export interface LayerInfo {
  layerId: number;
  depth: number;
  color: string;
  stitchCount: number;
  prominence: number;
  techniques: string[];                 // 该层使用的特殊技巧
}

export class Crochet3DGenerator {
  /**
   * 生成3D钩织指令
   */
  generate3DInstructions(
    image3DResult: Image3DResult,
    settings: PatternSettings
  ): LayeredCrochetPattern {
    const { layers, depthMap, extractedColors } = image3DResult;

    // 生成基础层（最深层的底座）
    const baseLayer = this.generateBaseLayer(image3DResult, settings);

    // 生成深度层（从深到浅）
    const depthLayers = this.generateDepthLayers(layers, settings);

    // 生成层级信息
    const layerInfo = this.generateLayerInfo(layers);

    // 合并所有指令
    const totalInstructions = this.mergeInstructions(baseLayer, depthLayers);

    return {
      baseLayer,
      depthLayers,
      layerInfo,
      totalInstructions
    };
  }

  /**
   * 生成基础层指令
   */
  private generateBaseLayer(image3DResult: Image3DResult, settings: PatternSettings): Crochet3DInstruction[] {
    const instructions: Crochet3DInstruction[] = [];
    const { width, height, extractedColors } = image3DResult;

    // 基础层使用最深的颜色，通常为黑色或深棕色
    const baseColor = this.findDeepestColor(extractedColors);

    for (let row = 0; row < height; row++) {
      const instruction: Crochet3DInstruction = {
        row: row + 1,
        instructions: this.generateBaseRowInstruction(width, baseColor, row, height),
        stitchCount: width,
        colorChanges: [],
        stitchTypes: [{
          type: 'single',
          count: width,
          color: baseColor,
          position: 1,
          symbol: '✕'
        }],
        depth: 255, // 最深层
        layerId: -1, // 基础层ID
        is3DElement: false,
        notes: row === 0 ? ['基础层 - 为3D效果提供支撑'] : undefined
      };

      instructions.push(instruction);
    }

    return instructions;
  }

  /**
   * 生成深度层指令
   */
  private generateDepthLayers(layers: ImageLayer[], settings: PatternSettings): Crochet3DInstruction[][] {
    return layers.map((layer, layerIndex) =>
      this.generateLayerInstructions(layer, layerIndex, settings)
    );
  }

  /**
   * 生成单个层的指令
   */
  private generateLayerInstructions(layer: ImageLayer, layerIndex: number, settings: PatternSettings): Crochet3DInstruction[] {
    const instructions: Crochet3DInstruction[] = [];
    const { imageData, depth, color, prominence } = layer;
    const { width, height } = imageData;

    // 分析层的特征
    const layerFeatures = this.analyzeLayerFeatures(layer);

    for (let row = 0; row < height; row++) {
      const rowData = this.extractRowData(imageData, row, width);

      if (rowData.length === 0) {
        // 空行
        continue;
      }

      const instruction: Crochet3DInstruction = {
        row: row + 1,
        instructions: this.generate3DRowInstruction(rowData, layerFeatures, color),
        stitchCount: rowData.length,
        colorChanges: this.detectColorChanges(rowData),
        stitchTypes: this.generateStitchTypes(rowData, layerFeatures),
        depth: depth,
        layerId: layerIndex,
        is3DElement: true,
        stitch3DType: this.determine3DStitchType(layerFeatures, rowData),
        notes: this.generateLayerNotes(layerFeatures, layerIndex)
      };

      instructions.push(instruction);
    }

    return instructions;
  }

  /**
   * 分析层的特征
   */
  private analyzeLayerFeatures(layer: ImageLayer): LayerFeatures {
    const { imageData, mask, depth, prominence } = layer;
    const { width, height } = imageData;
    const data = imageData.data;
    const maskData = mask.data;

    let edgePixels = 0;
    let totalPixels = 0;
    let colorVariations = 0;
    let complexity = 0;

    // 计算边缘像素和复杂性
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const maskAlpha = maskData[idx + 3];

        if (maskAlpha > 128) { // 该像素属于此层
          totalPixels++;

          // 检查是否为边缘
          if (this.isEdgePixel(x, y, maskData, width, height)) {
            edgePixels++;
          }

          // 计算颜色变化
          if (x > 0 && maskData[((y * width + x - 1) * 4) + 3] > 128) {
            const prevIdx = (y * width + x - 1) * 4;
            const colorDiff = Math.abs(data[idx] - data[prevIdx]) +
                            Math.abs(data[idx + 1] - data[prevIdx + 1]) +
                            Math.abs(data[idx + 2] - data[prevIdx + 2]);
            if (colorDiff > 30) {
              colorVariations++;
            }
          }
        }
      }
    }

    const edgeRatio = edgePixels / Math.max(1, totalPixels);
    const colorVariationRatio = colorVariations / Math.max(1, totalPixels);

    return {
      depth,
      prominence,
      edgeRatio,
      colorVariationRatio,
      complexity: (edgeRatio + colorVariationRatio) / 2,
      isDominantLayer: prominence > 0.3,
      requiresHighlighting: edgeRatio > 0.4
    };
  }

  /**
   * 检查是否为边缘像素
   */
  private isEdgePixel(x: number, y: number, maskData: Uint8ClampedArray, width: number, height: number): boolean {
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      return true;
    }

    const centerAlpha = maskData[((y * width + x) * 4) + 3];
    if (centerAlpha < 128) return false;

    // 检查8个方向的邻居
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborAlpha = maskData[((ny * width + nx) * 4) + 3];
        if (neighborAlpha < 128) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 生成3D行指令
   */
  private generate3DRowInstruction(rowData: RowPixel[], features: LayerFeatures, layerColor: any): string {
    const segments: string[] = [];
    let currentType: 'surface' | 'edge' | 'highlight' = 'surface';
    let currentCount = 0;

    rowData.forEach((pixel, index) => {
      const stitchType = this.determinePixelStitchType(pixel, features, index, rowData.length);

      if (stitchType !== currentType) {
        if (currentCount > 0) {
          segments.push(`${currentCount}${this.getStitchSymbol(currentType)}`);
        }
        currentType = stitchType;
        currentCount = 1;
      } else {
        currentCount++;
      }
    });

    if (currentCount > 0) {
      segments.push(`${currentCount}${this.getStitchSymbol(currentType)}`);
    }

    const layerDesc = features.isDominantLayer ? '主导层' : `第${features.depth}层`;
    return `${layerDesc}: ${segments.join(' ')} (${layerColor.name})`;
  }

  /**
   * 确定像素的针法类型
   */
  private determinePixelStitchType(pixel: RowPixel, features: LayerFeatures, index: number, rowLength: number): 'surface' | 'edge' | 'highlight' {
    // 边缘像素使用特殊针法
    if (pixel.isEdge) {
      return 'edge';
    }

    // 高光像素
    if (pixel.isHighlight) {
      return 'highlight';
    }

    // 复杂区域的表面像素
    if (features.complexity > 0.6) {
      // 根据位置变化针法
      if (index % 3 === 0) return 'highlight';
      if (index % 5 === 0) return 'edge';
    }

    return 'surface';
  }

  /**
   * 获取针法符号
   */
  private getStitchSymbol(stitchType: 'surface' | 'edge' | 'highlight'): string {
    switch (stitchType) {
      case 'surface': return '✕';      // 短针
      case 'edge': return 'V';         // 长针
      case 'highlight': return '●';    // 爆米花针
      default: return '✕';
    }
  }

  /**
   * 生成层级信息
   */
  private generateLayerInfo(layers: ImageLayer[]): LayerInfo[] {
    return layers.map((layer, index) => {
      const features = this.analyzeLayerFeatures(layer);
      const techniques: string[] = [];

      if (features.edgeRatio > 0.3) techniques.push('边缘增强');
      if (features.colorVariationRatio > 0.4) techniques.push('渐变编织');
      if (features.complexity > 0.6) techniques.push('混合针法');
      if (features.requiresHighlighting) techniques.push('高光处理');

      return {
        layerId: index,
        depth: layer.depth,
        color: layer.color.name,
        stitchCount: this.countLayerStitches(layer),
        prominence: layer.prominence,
        techniques
      };
    });
  }

  /**
   * 统计层的针数
   */
  private countLayerStitches(layer: ImageLayer): number {
    const { mask, width, height } = layer;
    const maskData = mask.data;
    let count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (maskData[idx + 3] > 128) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * 提取行数据
   */
  private extractRowData(imageData: ImageData, row: number, width: number): RowPixel[] {
    const data = imageData.data;
    const rowData: RowPixel[] = [];

    for (let x = 0; x < width; x++) {
      const idx = (row * width + x) * 4;
      const alpha = data[idx + 3];

      if (alpha > 128) {
        rowData.push({
          x,
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: alpha,
          isEdge: false, // 将在后续分析中确定
          isHighlight: false
        });
      }
    }

    return rowData;
  }

  /**
   * 检测颜色变化
   */
  private detectColorChanges(rowData: RowPixel[]): ColorChange[] {
    const colorChanges: ColorChange[] = [];

    for (let i = 1; i < rowData.length; i++) {
      const prev = rowData[i - 1];
      const curr = rowData[i];

      const colorDiff = Math.abs(prev.r - curr.r) +
                       Math.abs(prev.g - curr.g) +
                       Math.abs(prev.b - curr.b);

      if (colorDiff > 30) {
        colorChanges.push({
          stitch: i + 1,
          fromColor: { id: 'prev', name: 'previous', hexCode: '#000000', rgb: { r: prev.r, g: prev.g, b: prev.b } },
          toColor: { id: 'curr', name: 'current', hexCode: '#000000', rgb: { r: curr.r, g: curr.g, b: curr.b } }
        });
      }
    }

    return colorChanges;
  }

  /**
   * 生成针法类型
   */
  private generateStitchTypes(rowData: RowPixel[], features: LayerFeatures): StitchDetail[] {
    const stitchTypes: StitchDetail[] = [];
    let currentType = 'single';
    let currentCount = 0;

    rowData.forEach((pixel, index) => {
      const stitchType = features.edgeRatio > 0.3 ? 'double' : 'single';

      if (stitchType !== currentType) {
        if (currentCount > 0) {
          stitchTypes.push({
            type: currentType,
            count: currentCount,
            color: { id: 'layer', name: 'layer', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
            position: index - currentCount + 1,
            symbol: this.getStitchSymbol('surface')
          });
        }
        currentType = stitchType;
        currentCount = 1;
      } else {
        currentCount++;
      }
    });

    if (currentCount > 0) {
      stitchTypes.push({
        type: currentType,
        count: currentCount,
        color: { id: 'layer', name: 'layer', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
        position: rowData.length - currentCount + 1,
        symbol: this.getStitchSymbol('surface')
      });
    }

    return stitchTypes;
  }

  /**
   * 确定3D针法类型
   */
  private determine3DStitchType(features: LayerFeatures, rowData: RowPixel[]): 'surface' | 'edge' | 'highlight' | undefined {
    const edgeRatio = rowData.filter(p => p.isEdge).length / Math.max(1, rowData.length);
    const highlightRatio = rowData.filter(p => p.isHighlight).length / Math.max(1, rowData.length);

    if (edgeRatio > 0.5) return 'edge';
    if (highlightRatio > 0.3) return 'highlight';
    return 'surface';
  }

  /**
   * 生成层备注
   */
  private generateLayerNotes(features: LayerFeatures, layerIndex: number): string[] | undefined {
    const notes: string[] = [];

    if (features.isDominantLayer) {
      notes.push('主导层 - 决定整体3D效果');
    }

    if (features.requiresHighlighting) {
      notes.push('需要高光处理');
    }

    if (features.edgeRatio > 0.4) {
      notes.push('边缘增强 - 增强立体感');
    }

    if (features.complexity > 0.6) {
      notes.push('复杂编织 - 建议使用混合针法');
    }

    return notes.length > 0 ? notes : undefined;
  }

  /**
   * 查找最深的颜色
   */
  private findDeepestColor(colors: any[]): any {
    // 简单实现：返回最深的颜色
    const deepColors = colors.filter(c =>
      c.name.includes('黑') || c.name.includes('深') || c.name.includes('棕')
    );
    return deepColors.length > 0 ? deepColors[0] : colors[0];
  }

  /**
   * 生成基础行指令
   */
  private generateBaseRowInstruction(width: number, color: any, row: number, totalRows: number): string {
    const technique = row === 0 ? '起针' : (row === totalRows - 1 ? '收尾' : '编织');
    return `${technique}: ${width}短针 (${color.name})`;
  }

  /**
   * 合并所有指令
   */
  private mergeInstructions(baseLayer: Crochet3DInstruction[], depthLayers: Crochet3DInstruction[][]): Crochet3DInstruction[] {
    const allInstructions: Crochet3DInstruction[] = [];

    // 先添加基础层
    allInstructions.push(...baseLayer);

    // 然后按深度顺序添加各层（从深到浅）
    depthLayers.forEach((layer, index) => {
      allInstructions.push(...layer);
    });

    return allInstructions;
  }
}

interface LayerFeatures {
  depth: number;
  prominence: number;
  edgeRatio: number;
  colorVariationRatio: number;
  complexity: number;
  isDominantLayer: boolean;
  requiresHighlighting: boolean;
}

interface RowPixel {
  x: number;
  r: number;
  g: number;
  b: number;
  a: number;
  isEdge: boolean;
  isHighlight: boolean;
}

export const crochet3DGenerator = new Crochet3DGenerator();
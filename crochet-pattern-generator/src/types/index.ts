export interface CrochetPattern {
  id: string;
  name: string;
  width: number;
  height: number;
  stitchesPerRow: number;
  colors: YarnColor[];
  grid: ColorCell[][];
  instructions: CrochetInstruction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface YarnColor {
  id: string;
  name: string;
  hexCode: string;
  rgb: { r: number; g: number; b: number };
  yarnBrand?: string;
  yarnWeight?: string;
}

export interface ColorCell {
  x: number;
  y: number;
  color: YarnColor;
  stitchType: StitchType;
}

export type StitchType =
  | 'single'           // 短针 (X)
  | 'double'           // 长针 (V)
  | 'half-double'      // 中长针 (H)
  | 'treble'           // 长长针 (T)
  | 'double-treble'    // 特长针 (DT)
  | 'slip'             // 引拔针 (S)
  | 'chain'            // 锁针 (CH)
  | 'increase'         // 加针 (inc)
  | 'decrease'         // 减针 (dec)
  | '2-together'       // 2针并1针 (2tog)
  | '3-together'       // 3针并1针 (3tog)
  | 'shell'            // 贝壳针 (shell)
  | 'popcorn'          // 爆米花针 (pop)
  | 'bobble'           // 泡泡针 (bobble)
  | 'front-post'       // 前引长针 (FP)
  | 'back-post';       // 后引长针 (BP)

// 钩针符号信息
export interface StitchSymbol {
  type: StitchType;
  symbol: string;           // 图解符号
  abbreviation: string;     // 编写缩写
  chineseName: string;      // 中文名称
  description: string;      // 详细描述
  height: number;           // 相对高度系数
  difficulty: 'easy' | 'medium' | 'hard'; // 难度等级
}

// 增强的编织指令
export interface CrochetInstruction {
  row: number;
  instructions: string;
  stitchCount: number;
  colorChanges: ColorChange[];
  stitchTypes: StitchDetail[]; // 每行的详细针法信息
  notes?: string[];           // 特殊说明
  difficulty?: 'easy' | 'medium' | 'hard'; // 本行难度
}

// 针法详情
export interface StitchDetail {
  type: StitchType;
  count: number;
  color: YarnColor;
  position?: number;         // 在行中的位置
  symbol?: string;          // 使用的符号
}

export interface ColorChange {
  stitch: number;
  fromColor: YarnColor;
  toColor: YarnColor;
}

export interface PatternSettings {
  width: number;
  height: number;
  stitchesPerRow: number;
  maxColors: number;
  colorSimplification: number; // 0-1, higher means more simplification
  stitchType: StitchType;
  removeBlackLines: boolean; // 是否移除图片中的黑色线条
  // 新增钩织设置
  autoStitchPattern: boolean; // 是否根据图片内容自动选择针法
  mixedStitches: boolean;     // 是否允许混合使用多种针法
  difficulty: 'easy' | 'medium' | 'hard'; // 整体难度
  showSymbols: boolean;       // 是否显示图解符号
  showColorChangeMarkers: boolean; // 是否显示换线标记
  gauge: {
    stitchesPerInch: number;
    rowsPerInch: number;
  };
}

export interface ImageUploadResult {
  originalImage: HTMLImageElement;
  pixelatedData: ImageData;
  extractedColors: YarnColor[];
  width: number;
  height: number;
  analysisResult?: any; // 智能分析结果（可选）
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg';
  includeInstructions: boolean;
  includeColorLegend: boolean;
  includeGrid: boolean;
  dpi?: number;
}
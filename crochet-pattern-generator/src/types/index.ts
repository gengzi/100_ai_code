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
  color: YarnColor | null;
  stitchType: StitchType | null;
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
  // 钩织范围设置
  crochetRange: {
    type: 'full' | 'custom' | 'circular'; // 钩织范围类型
    centerX?: number; // 自定义范围中心X坐标
    centerY?: number; // 自定义范围中心Y坐标
    radius?: number; // 圆形范围半径
    shape?: 'rectangle' | 'circle' | 'ellipse'; // 范围形状
    width?: number; // 自定义范围宽度
    height?: number; // 自定义范围高度
    startMethod?: 'chain' | 'magic-ring'; // 起针方法：锁链起针或环形起针
    direction?: 'rows' | 'rounds'; // 钩织方向：行钩织或圈钩织
  };
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

export interface Depth3DSettings {
  depthIntensity: number;        // 深度强度 (0.1-2.0)
  layerCount: number;            // 分层数量 (3-20)
  smoothing: boolean;            // 是否平滑深度
  edgeEnhancement: boolean;      // 是否增强边缘
  colorDepth: boolean;           // 是否基于颜色生成深度
  contrast: number;              // 对比度 (0.5-2.0)
  brightness: number;            // 亮度 (0.5-1.5)
}

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

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg';
  includeInstructions: boolean;
  includeColorLegend: boolean;
  includeGrid: boolean;
  dpi?: number;
}
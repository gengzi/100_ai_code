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

export type StitchType = 'single' | 'double' | 'half-double' | 'treble' | 'slip' | 'chain';

export interface CrochetInstruction {
  row: number;
  instructions: string;
  stitchCount: number;
  colorChanges: ColorChange[];
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
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg';
  includeInstructions: boolean;
  includeColorLegend: boolean;
  includeGrid: boolean;
  dpi?: number;
}
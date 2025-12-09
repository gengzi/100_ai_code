import { StitchType, StitchSymbol } from '../types';

// 钩针符号定义系统
export const CROCHET_SYMBOLS: Record<StitchType, StitchSymbol> = {
  single: {
    type: 'single',
    symbol: '✕',
    abbreviation: 'X',
    chineseName: '短针',
    description: '最基础的钩针针法，插入下一针，钩线，拉出，再钩线穿过两个线圈',
    height: 1,
    difficulty: 'easy'
  },
  double: {
    type: 'double',
    symbol: '✓',
    abbreviation: 'V',
    chineseName: '长针',
    description: '绕线，插入下一针，钩线拉出，钩线穿过两个线圈，再钩线穿过剩余两个线圈',
    height: 2,
    difficulty: 'easy'
  },
  'half-double': {
    type: 'half-double',
    symbol: '○',
    abbreviation: 'H',
    chineseName: '中长针',
    description: '绕线，插入下一针，钩线拉出，钩线穿过所有三个线圈',
    height: 1.5,
    difficulty: 'easy'
  },
  treble: {
    type: 'treble',
    symbol: 'T',
    abbreviation: 'T',
    chineseName: '长长针',
    description: '绕两次线，插入下一针，钩线拉出，(钩线穿过两个线圈)x3',
    height: 3,
    difficulty: 'medium'
  },
  'double-treble': {
    type: 'double-treble',
    symbol: '†',
    abbreviation: 'DT',
    chineseName: '特长针',
    description: '绕三次线，插入下一针，钩线拉出，(钩线穿过两个线圈)x4',
    height: 4,
    difficulty: 'hard'
  },
  slip: {
    type: 'slip',
    symbol: '•',
    abbreviation: 'S',
    chineseName: '引拔针',
    description: '插入下一针，钩线，直接穿过所有线圈',
    height: 0.5,
    difficulty: 'easy'
  },
  chain: {
    type: 'chain',
    symbol: '○-',
    abbreviation: 'CH',
    chineseName: '锁针',
    description: '基础针法，用于起针和连接，钩线穿过线圈',
    height: 0.8,
    difficulty: 'easy'
  },
  increase: {
    type: 'increase',
    symbol: 'V',
    abbreviation: 'inc',
    chineseName: '加针',
    description: '在同一针目中钩两针，用于增加针数',
    height: 1.5,
    difficulty: 'easy'
  },
  decrease: {
    type: 'decrease',
    symbol: '∧',
    abbreviation: 'dec',
    chineseName: '减针',
    description: '将两针合并为一针，用于减少针数',
    height: 1.2,
    difficulty: 'medium'
  },
  '2-together': {
    type: '2-together',
    symbol: '⨂',
    abbreviation: '2tog',
    chineseName: '2针并1针',
    description: '将两针钩织在一起，形成减针效果',
    height: 1.2,
    difficulty: 'medium'
  },
  '3-together': {
    type: '3-together',
    symbol: '⨁',
    abbreviation: '3tog',
    chineseName: '3针并1针',
    description: '将三针钩织在一起，形成明显减针效果',
    height: 1.1,
    difficulty: 'hard'
  },
  shell: {
    type: 'shell',
    symbol: '❀',
    abbreviation: 'shell',
    chineseName: '贝壳针',
    description: '在同一针目中钩多针（通常是2-5针长针），形成贝壳形状',
    height: 2.5,
    difficulty: 'medium'
  },
  popcorn: {
    type: 'popcorn',
    symbol: '◈',
    abbreviation: 'pop',
    chineseName: '爆米花针',
    description: '钩多针后拆除，重新钩合形成立体凸起效果',
    height: 3,
    difficulty: 'hard'
  },
  bobble: {
    type: 'bobble',
    symbol: '●',
    abbreviation: 'bobble',
    chineseName: '泡泡针',
    description: '在同一位置钩多针未完成的针，最后一次性完成',
    height: 2.2,
    difficulty: 'medium'
  },
  'front-post': {
    type: 'front-post',
    symbol: '⨴',
    abbreviation: 'FP',
    chineseName: '前引长针',
    description: '在前行针法的前面插入钩针进行钩织，形成纹理效果',
    height: 2,
    difficulty: 'medium'
  },
  'back-post': {
    type: 'back-post',
    symbol: '⨵',
    abbreviation: 'BP',
    chineseName: '后引长针',
    description: '在前行针法的后面插入钩针进行钩织，形成纹理效果',
    height: 2,
    difficulty: 'medium'
  }
};

// 针法分组
export const STITCH_GROUPS = {
  basic: ['single', 'double', 'half-double', 'chain', 'slip'],
  advanced: ['treble', 'double-treble', 'front-post', 'back-post'],
  shaping: ['increase', 'decrease', '2-together', '3-together'],
  textured: ['shell', 'popcorn', 'bobble']
};

// 根据难度获取针法
export function getStitchesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): StitchType[] {
  switch (difficulty) {
    case 'easy':
      return STITCH_GROUPS.basic as StitchType[];
    case 'medium':
      return [...STITCH_GROUPS.basic, ...STITCH_GROUPS.shaping, 'treble', 'shell', 'bobble', 'front-post', 'back-post'] as StitchType[];
    case 'hard':
      return Object.keys(CROCHET_SYMBOLS) as StitchType[];
    default:
      return STITCH_GROUPS.basic as StitchType[];
  }
}

// 根据图片内容推荐针法
export function recommendStitchPattern(
  imageComplexity: 'simple' | 'moderate' | 'complex',
  userDifficulty: 'easy' | 'medium' | 'hard'
): {
  primaryStitch: StitchType;
  secondaryStitches?: StitchType[];
  recommendations: string[];
} {
  const availableStitches = getStitchesByDifficulty(userDifficulty);

  switch (imageComplexity) {
    case 'simple':
      return {
        primaryStitch: 'single',
        recommendations: [
          '简单的图案建议使用短针，能够清晰地展现图案轮廓',
          '如果想要更快的编织速度，可以考虑使用长针'
        ]
      };

    case 'moderate':
      const moderatePrimary = availableStitches.includes('double') ? 'double' : 'single';
      return {
        primaryStitch: moderatePrimary,
        secondaryStitches: availableStitches.includes('shell') ? ['shell'] : undefined,
        recommendations: [
          '中等复杂度的图案可以适当使用一些纹理针法',
          '建议在重点区域使用贝壳针等装饰针法'
        ]
      };

    case 'complex':
      const complexPrimary = availableStitches.includes('double') ? 'double' :
                            availableStitches.includes('treble') ? 'treble' : 'single';
      return {
        primaryStitch: complexPrimary,
        secondaryStitches: availableStitches.filter(s =>
          STITCH_GROUPS.textured.includes(s) || STITCH_GROUPS.shaping.includes(s)
        ).slice(0, 3),
        recommendations: [
          '复杂图案建议使用多种针法组合，以更好地表现细节',
          '可以在背景使用简单针法，主体部分使用纹理针法',
          '适当使用减针和加针来塑造形状'
        ]
      };

    default:
      return {
        primaryStitch: 'single',
        recommendations: ['默认使用短针']
      };
  }
}

// 获取针法的详细说明文本
export function getStitchInstructions(stitchType: StitchType): string[] {
  const symbol = CROCHET_SYMBOLS[stitchType];
  if (!symbol) return ['未知针法'];

  return [
    `🔸 ${symbol.chineseName} (${symbol.abbreviation})`,
    `符号: ${symbol.symbol}`,
    `难度: ${symbol.difficulty === 'easy' ? '简单' : symbol.difficulty === 'medium' ? '中等' : '困难'}`,
    `相对高度: ${symbol.height}`,
    '',
    `详细说明: ${symbol.description}`,
    '',
    `编织技巧: ${getStitchTip(stitchType)}`
  ];
}

// 获取针法技巧
function getStitchTip(stitchType: StitchType): string {
  const tips = {
    single: '保持针法松紧一致，避免过紧或过松',
    double: '注意保持线圈的张力均匀',
    'half-double': '适合在短针和长针之间过渡时使用',
    treble: '适合制作镂空图案和装饰元素',
    'double-treble': '需要较多线材，但效果突出',
    slip: '用于连接和移动位置，不宜过多使用',
    chain: '起针时要保持适当松度，不要过紧',
    increase: '均匀分布在整行中，避免局部过于密集',
    decrease: '注意保持对称，避免图案变形',
    '2-together': '常用于衣物袖窿和领口的收针',
    '3-together': '适合制作荷叶边等装饰效果',
    shell: '在同一针目中钩织时注意保持一致',
    popcorn: '完成后需要用手指整理形状',
    bobble: '控制好线圈的松紧度',
    'front-post': '注意观察前行针法的位置',
    'back-post': '可以创造出立体纹理效果'
  };

  return tips[stitchType] || '请参考相关教程学习';
}
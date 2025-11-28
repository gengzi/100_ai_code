const Joi = require('joi');

/**
 * Excalidraw数据验证器
 * 验证输入的JSON数据是否符合Excalidraw格式
 */

// 定义基本元素验证模式
const baseElementSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid(
    'rectangle', 'ellipse', 'diamond', 'line', 'arrow',
    'text', 'image', 'freedraw', 'magicframe'
  ).required(),
  x: Joi.number().required(),
  y: Joi.number().required(),
  width: Joi.number().min(0).required(),
  height: Joi.number().min(0).required(),
  angle: Joi.number().default(0),
  strokeColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|transparent$/).optional(),
  fillStyle: Joi.string().valid('solid', 'hachure', 'cross-hatch', 'transparent').default('solid'),
  strokeWidth: Joi.number().min(0).default(1),
  strokeStyle: Joi.string().valid('solid', 'dashed', 'dotted').default('solid'),
  roughness: Joi.number().min(0).max(2).default(1),
  opacity: Joi.number().min(0).max(100).default(100),
  points: Joi.array().items(
    Joi.array().length(2).items(Joi.number()).required()
  ).when('type', {
    is: Joi.string().valid('line', 'arrow', 'freedraw'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  text: Joi.string().when('type', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  fontSize: Joi.number().min(1).when('type', {
    is: 'text',
    then: Joi.number().min(1).default(20),
    otherwise: Joi.optional()
  }),
  fontFamily: Joi.number().integer().min(1).max(4).when('type', {
    is: 'text',
    then: Joi.number().integer().min(1).max(4).default(1),
    otherwise: Joi.optional()
  }),
  textAlign: Joi.string().valid('left', 'center', 'right').when('type', {
    is: 'text',
    then: Joi.string().valid('left', 'center', 'right').default('left'),
    otherwise: Joi.optional()
  }),
  verticalAlign: Joi.string().valid('top', 'middle', 'bottom').when('type', {
    is: 'text',
    then: Joi.string().valid('top', 'middle', 'bottom').default('top'),
    otherwise: Joi.optional()
  }),
  containerId: Joi.string().optional(),
  groupIds: Joi.array().items(Joi.string()).optional(),
  fileId: Joi.string().when('type', {
    is: 'image',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  status: Joi.string().valid('pending', 'saved', 'error').when('type', {
    is: 'image',
    then: Joi.string().valid('pending', 'saved', 'error').default('saved'),
    otherwise: Joi.optional()
  }),
  startArrowhead: Joi.string().valid('arrow', 'dot', 'bar').optional(),
  endArrowhead: Joi.string().valid('arrow', 'dot', 'bar').optional(),
  lastCommittedPoint: Joi.array().length(2).items(Joi.number()).optional(),
  startBinding: Joi.object().optional(),
  endBinding: Joi.object().optional(),
  boundElements: Joi.array().optional(),
  roundness: Joi.object({
    type: Joi.string().valid(0, 1, 2, 3).optional(),
    value: Joi.number().min(0).optional()
  }).optional(),
  isDeleted: Joi.boolean().default(false)
});

// 应用状态验证模式
const appStateSchema = Joi.object({
  gridSize: Joi.number().allow(null).default(null),
  viewBackgroundColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#ffffff'),
  currentItemStrokeColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  currentItemBackgroundColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|transparent$/).optional(),
  currentItemFillStyle: Joi.string().valid('solid', 'hachure', 'cross-hatch', 'transparent').optional(),
  currentItemStrokeWidth: Joi.number().min(0).optional(),
  currentItemStrokeStyle: Joi.string().valid('solid', 'dashed', 'dotted').optional(),
  currentItemRoughness: Joi.number().min(0).max(2).optional(),
  currentItemOpacity: Joi.number().min(0).max(100).optional(),
  currentItemFontFamily: Joi.number().integer().min(1).max(4).optional(),
  currentItemFontSize: Joi.number().min(1).optional(),
  currentItemTextAlign: Joi.string().valid('left', 'center', 'right').optional(),
  currentItemVerticalAlign: Joi.string().valid('top', 'middle', 'bottom').optional(),
  currentItemStartArrowhead: Joi.string().valid('arrow', 'dot', 'bar').optional(),
  currentItemEndArrowhead: Joi.string().valid('arrow', 'dot', 'bar').optional(),
  zoom: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).optional(),
  scrollX: Joi.number().default(0),
  scrollY: Joi.number().default(0),
  name: Joi.string().optional(),
  isPaused: Joi.boolean().optional(),
  viewModeEnabled: Joi.boolean().optional(),
  zenModeEnabled: Joi.boolean().optional(),
  gridModeEnabled: Joi.boolean().optional(),
  objectsSnapModeEnabled: Joi.boolean().optional()
});

// 文件验证模式
const fileSchema = Joi.object({
  id: Joi.string().required(),
  mimeType: Joi.string().required(),
  dataURL: Joi.string().pattern(/^data:image\/[a-zA-Z]+;base64,/).optional(),
  buffer: Joi.binary().optional(),
  created: Joi.number().optional(),
  isDeleted: Joi.boolean().default(false)
});

// 主Excalidraw数据验证模式
const excalidrawDataSchema = Joi.object({
  type: Joi.string().valid('excalidraw').required(),
  version: Joi.number().integer().min(1).max(2).required(),
  source: Joi.string().uri().optional(),
  elements: Joi.array().items(baseElementSchema).required(),
  appState: appStateSchema.optional(),
  files: Joi.object().pattern(Joi.string(), fileSchema).optional()
});

/**
 * 验证Excalidraw数据
 * @param {Object} data - 要验证的数据
 * @returns {Object} 验证结果
 */
function validateExcalidrawData(data) {
  const result = excalidrawDataSchema.validate(data, {
    allowUnknown: true,  // 允许未知字段（兼容性考虑）
    stripUnknown: false, // 不移除未知字段
    abortEarly: false    // 报告所有错误
  });

  const validation = {
    isValid: !result.error,
    errors: [],
    warnings: [],
    data: result.value
  };

  if (result.error) {
    validation.errors = result.error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
  }

  // 额外的业务逻辑验证
  const businessValidationErrors = validateBusinessRules(data);
  validation.errors.push(...businessValidationErrors);

  // 性能警告
  const warnings = checkPerformanceWarnings(data);
  validation.warnings.push(...warnings);

  return validation;
}

/**
 * 验证业务规则
 * @param {Object} data - Excalidraw数据
 * @returns {Array} 业务规则错误列表
 */
function validateBusinessRules(data) {
  const errors = [];

  if (!data.elements || data.elements.length === 0) {
    errors.push({
      field: 'elements',
      message: '至少需要一个图形元素',
      value: data.elements?.length || 0
    });
    return errors;
  }

  // 检查元素ID唯一性
  const elementIds = data.elements.map(el => el.id).filter(Boolean);
  const duplicateIds = elementIds.filter((id, index) => elementIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push({
      field: 'elements',
      message: `发现重复的元素ID: ${[...new Set(duplicateIds)].join(', ')}`,
      value: duplicateIds
    });
  }

  // 检查文本元素是否有内容
  const textElements = data.elements.filter(el => el.type === 'text');
  const emptyTextElements = textElements.filter(el => !el.text || el.text.trim() === '');
  if (emptyTextElements.length > 0) {
    errors.push({
      field: 'elements',
      message: `${emptyTextElements.length}个文本元素没有内容`,
      value: emptyTextElements.map(el => el.id)
    });
  }

  // 检查图片元素是否有对应的文件
  const imageElements = data.elements.filter(el => el.type === 'image' && !el.isDeleted);
  const fileIds = Object.keys(data.files || {});
  const missingFiles = imageElements.filter(el => !fileIds.includes(el.fileId));
  if (missingFiles.length > 0) {
    errors.push({
      field: 'files',
      message: `${missingFiles.length}个图片元素缺少对应的文件数据`,
      value: missingFiles.map(el => el.fileId)
    });
  }

  // 检查元素尺寸合理性
  const oversizedElements = data.elements.filter(el => {
    const area = (el.width || 0) * (el.height || 0);
    return area > 10000000; // 10M像素
  });
  if (oversizedElements.length > 0) {
    errors.push({
      field: 'elements',
      message: `${oversizedElements.length}个元素尺寸过大`,
      value: oversizedElements.map(el => ({
        id: el.id,
        type: el.type,
        width: el.width,
        height: el.height,
        area: el.width * el.height
      }))
    });
  }

  // 检查点的数量（线条和自由绘制）
  const pointHeavyElements = data.elements.filter(el => {
    return (el.type === 'line' || el.type === 'arrow' || el.type === 'freedraw') &&
           el.points && el.points.length > 1000;
  });
  if (pointHeavyElements.length > 0) {
    errors.push({
      field: 'elements',
      message: `${pointHeavyElements.length}个线条元素点数过多`,
      value: pointHeavyElements.map(el => ({
        id: el.id,
        type: el.type,
        pointsCount: el.points.length
      }))
    });
  }

  return errors;
}

/**
 * 检查性能警告
 * @param {Object} data - Excalidraw数据
 * @returns {Array} 警告列表
 */
function checkPerformanceWarnings(data) {
  const warnings = [];

  // 元素数量警告
  const elementCount = data.elements?.length || 0;
  if (elementCount > 1000) {
    warnings.push({
      field: 'elements',
      message: `元素数量过多 (${elementCount})，可能影响渲染性能`,
      level: 'warning'
    });
  }

  // 文件大小警告（如果有文件数据）
  if (data.files) {
    let totalFileSize = 0;
    let imageCount = 0;

    for (const [fileId, file] of Object.entries(data.files)) {
      if (file.buffer) {
        totalFileSize += file.buffer.length;
      } else if (file.dataURL) {
        // 估算DataURL的大小
        totalFileSize += file.dataURL.length * 0.75; // base64解码大约25%的膨胀
      }
      imageCount++;
    }

    if (totalFileSize > 50 * 1024 * 1024) { // 50MB
      warnings.push({
        field: 'files',
        message: `图片文件总大小过大 (${(totalFileSize / 1024 / 1024).toFixed(1)}MB)`,
        level: 'warning'
      });
    }

    if (imageCount > 20) {
      warnings.push({
        field: 'files',
        message: `图片数量过多 (${imageCount})，可能影响渲染性能`,
        level: 'warning'
      });
    }
  }

  // 复杂图形警告
  const complexElements = data.elements?.filter(el => {
    return (el.type === 'freedraw' && el.points && el.points.length > 500) ||
           (el.type === 'text' && el.text && el.text.length > 1000);
  }) || [];

  if (complexElements.length > 0) {
    warnings.push({
      field: 'elements',
      message: `${complexElements.length}个复杂元素可能增加渲染时间`,
      level: 'info'
    });
  }

  return warnings;
}

/**
 * 验证渲染选项
 * @param {Object} options - 渲染选项
 * @returns {Object} 验证结果
 */
function validateRenderOptions(options = {}) {
  const schema = Joi.object({
    format: Joi.string().valid('png', 'jpeg', 'webp', 'svg').default('png'),
    quality: Joi.number().integer().min(1).max(100).default(90),
    width: Joi.number().integer().min(1).max(4096).optional(),
    height: Joi.number().integer().min(1).max(4096).optional(),
    backgroundColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    scale: Joi.number().min(0.1).max(5).default(1),
    transparent: Joi.boolean().default(false)
  });

  const result = schema.validate(options);

  return {
    isValid: !result.error,
    errors: result.error ? result.error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) : [],
    data: result.value
  };
}

/**
 * 清理和优化数据
 * @param {Object} data - 原始数据
 * @returns {Object} 清理后的数据
 */
function cleanAndOptimizeData(data) {
  const cleaned = {
    type: 'excalidraw',
    version: data.version || 2,
    source: data.source || 'excalidraw-api',
    elements: [],
    appState: {},
    files: {}
  };

  // 清理元素
  if (data.elements) {
    cleaned.elements = data.elements
      .filter(el => !el.isDeleted && el.id)
      .map(el => {
        const cleanedEl = { ...el };

        // 移除不必要的字段
        delete cleanedEl.lastCommittedPoint;
        delete cleanedEl.seed;
        delete cleanedEl.versionNonce;

        return cleanedEl;
      });
  }

  // 清理应用状态
  if (data.appState) {
    cleaned.appState = {
      viewBackgroundColor: data.appState.viewBackgroundColor || '#ffffff',
      gridSize: data.appState.gridSize || null,
      ...data.appState
    };
  }

  // 清理文件
  if (data.files) {
    cleaned.files = { ...data.files };
  }

  return cleaned;
}

module.exports = {
  validateExcalidrawData,
  validateRenderOptions,
  validateBusinessRules,
  checkPerformanceWarnings,
  cleanAndOptimizeData
};
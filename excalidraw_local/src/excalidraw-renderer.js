const { createCanvas, registerFont, loadImage } = require('canvas');
const path = require('path');
const sharp = require('sharp');

/**
 * Excalidraw Canvas渲染器
 * 负责将Excalidraw JSON数据渲染为图片
 */
class ExcalidrawCanvasRenderer {
  constructor(options = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');

    // 注册字体
    this.registerFonts();

    // 缓存
    this.imageCache = new Map();
    this.fontMetricsCache = new Map();

    // 设置默认样式
    this.setupDefaultContext();
  }

  /**
   * 注册Excalidraw使用的字体
   */
  registerFonts() {
    const fontsDir = path.join(__dirname, '../fonts');

    try {
      // Virgil - Excalidraw的主要字体
      registerFont(path.join(fontsDir, 'Virgil.woff2'), {
        family: 'Virgil',
        weight: 'normal',
        style: 'normal'
      });

      // Cascadia Code - 代码字体
      registerFont(path.join(fontsDir, 'CascadiaCode.woff2'), {
        family: 'Cascadia Code',
        weight: 'normal',
        style: 'normal'
      });

      // Assistant 字体
      registerFont(path.join(fontsDir, 'Assistant-Regular.woff2'), {
        family: 'Assistant',
        weight: 'normal',
        style: 'normal'
      });
    } catch (error) {
      console.warn('字体注册失败，将使用默认字体:', error.message);
    }
  }

  /**
   * 设置默认画布上下文
   */
  setupDefaultContext() {
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * 主渲染方法
   * @param {Object} excalidrawData - Excalidraw数据
   * @param {Object} options - 渲染选项
   */
  async render(excalidrawData, options = {}) {
    const { elements = [], appState = {}, files = {} } = excalidrawData;

    try {
      // 设置背景
      this.setBackground(appState.viewBackgroundColor || '#ffffff');

      // 设置网格（如果有）
      if (appState.gridSize && appState.gridSize > 0) {
        this.drawGrid(appState.gridSize);
      }

      // 优化和排序元素
      const optimizedElements = this.optimizeElements(elements);
      const sortedElements = this.sortElementsByZIndex(optimizedElements);

      // 预加载图片
      const loadedImages = await this.loadImages(files);

      // 渲染所有元素
      for (const element of sortedElements) {
        if (element.isDeleted || element.opacity === 0) continue;

        this.ctx.save();

        // 应用变换
        this.applyTransform(element);

        // 设置样式
        this.setElementStyle(element);

        // 根据类型绘制
        await this.renderElement(element, loadedImages);

        this.ctx.restore();
      }

      return this.canvas;

    } catch (error) {
      console.error('渲染失败:', error);
      throw new Error(`渲染失败: ${error.message}`);
    }
  }

  /**
   * 渲染单个元素
   */
  async renderElement(element, loadedImages) {
    switch (element.type) {
      case 'rectangle':
        this.drawRectangle(element);
        break;
      case 'ellipse':
        this.drawEllipse(element);
        break;
      case 'diamond':
        this.drawDiamond(element);
        break;
      case 'line':
        this.drawLine(element);
        break;
      case 'arrow':
        this.drawArrow(element, loadedImages);
        break;
      case 'text':
        await this.drawText(element);
        break;
      case 'image':
        this.drawImage(element, loadedImages);
        break;
      case 'freedraw':
        this.drawFreeDraw(element);
        break;
      case 'magicframe':
        // 魔法框架可选实现
        break;
      default:
        console.warn(`不支持的元素类型: ${element.type}`);
    }
  }

  /**
   * 设置背景
   */
  setBackground(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制网格
   */
  drawGrid(gridSize) {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 0.5;
    this.ctx.setLineDash([]);

    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * 应用元素变换
   */
  applyTransform(element) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    // 应用旋转
    if (element.angle && element.angle !== 0) {
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((element.angle * Math.PI) / 180);
      this.ctx.translate(-centerX, -centerY);
    }
  }

  /**
   * 设置元素样式
   */
  setElementStyle(element) {
    // 设置透明度
    this.ctx.globalAlpha = (element.opacity || 100) / 100;

    // 设置边框样式
    if (element.strokeColor) {
      this.ctx.strokeStyle = element.strokeColor;
    }

    // 设置填充样式
    if (element.backgroundColor && element.fillStyle !== 'transparent') {
      this.ctx.fillStyle = element.backgroundColor;
    }

    // 设置线宽
    this.ctx.lineWidth = Math.max(1, element.strokeWidth || 1);

    // 设置线条样式
    if (element.strokeStyle === 'dashed') {
      this.ctx.setLineDash([8, 8]);
    } else if (element.strokeStyle === 'dotted') {
      this.ctx.setLineDash([2, 4]);
    } else {
      this.ctx.setLineDash([]);
    }
  }

  /**
   * 绘制矩形
   */
  drawRectangle(element) {
    const { x, y, width, height } = element;

    // 绘制填充
    if (element.backgroundColor && element.fillStyle !== 'transparent') {
      this.ctx.fillRect(x, y, width, height);
    }

    // 绘制边框
    if (element.strokeColor && element.strokeWidth > 0) {
      this.ctx.strokeRect(x, y, width, height);
    }

    // 添加粗糙效果（简化版）
    if (element.roughness && element.roughness > 0) {
      this.addRoughness(element);
    }
  }

  /**
   * 绘制椭圆
   */
  drawEllipse(element) {
    const { x, y, width, height } = element;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    // 填充
    if (element.backgroundColor && element.fillStyle !== 'transparent') {
      this.ctx.fill();
    }

    // 边框
    if (element.strokeColor && element.strokeWidth > 0) {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制菱形
   */
  drawDiamond(element) {
    const { x, y, width, height } = element;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, y);
    this.ctx.lineTo(x + width, centerY);
    this.ctx.lineTo(centerX, y + height);
    this.ctx.lineTo(x, centerY);
    this.ctx.closePath();

    // 填充
    if (element.backgroundColor && element.fillStyle !== 'transparent') {
      this.ctx.fill();
    }

    // 边框
    if (element.strokeColor && element.strokeWidth > 0) {
      this.ctx.stroke();
    }
  }

  /**
   * 绘制线条
   */
  drawLine(element) {
    const { points } = element;

    if (!points || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }

    this.ctx.stroke();
  }

  /**
   * 绘制箭头
   */
  drawArrow(element, loadedImages) {
    const { points, startArrowhead, endArrowhead } = element;

    // 绘制线条部分
    this.drawLine(element);

    if (!points || points.length < 2) return;

    // 计算并绘制箭头
    if (endArrowhead) {
      const lastIndex = points.length - 1;
      const angle = Math.atan2(
        points[lastIndex][1] - points[lastIndex - 1][1],
        points[lastIndex][0] - points[lastIndex - 1][0]
      );
      this.drawArrowHead(
        points[lastIndex][0],
        points[lastIndex][1],
        angle,
        element.strokeColor,
        element.strokeWidth,
        endArrowhead
      );
    }

    if (startArrowhead) {
      const angle = Math.atan2(
        points[1][1] - points[0][1],
        points[1][0] - points[0][0]
      );
      this.drawArrowHead(
        points[0][0],
        points[0][1],
        angle + Math.PI,
        element.strokeColor,
        element.strokeWidth,
        startArrowhead
      );
    }
  }

  /**
   * 绘制箭头头部
   */
  drawArrowHead(x, y, angle, color, strokeWidth, type = 'arrow') {
    this.ctx.save();

    const arrowLength = Math.max(10, strokeWidth * 4);
    const arrowAngle = Math.PI / 6;

    this.ctx.fillStyle = color;
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    if (type === 'arrow') {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-arrowLength * Math.cos(arrowAngle), -arrowLength * Math.sin(arrowAngle));
      this.ctx.lineTo(-arrowLength * Math.cos(arrowAngle), arrowLength * Math.sin(arrowAngle));
      this.ctx.closePath();
      this.ctx.fill();
    } else if (type === 'dot') {
      this.ctx.beginPath();
      this.ctx.arc(-arrowLength/2, 0, strokeWidth * 2, 0, 2 * Math.PI);
      this.ctx.fill();
    } else if (type === 'bar') {
      this.ctx.beginPath();
      this.ctx.moveTo(-arrowLength, -arrowLength/2);
      this.ctx.lineTo(0, 0);
      this.ctx.lineTo(-arrowLength, arrowLength/2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * 绘制自由绘制
   */
  drawFreeDraw(element) {
    const { points, pressure } = element;

    if (!points || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);

    // 使用贝塞尔曲线平滑路径
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      this.ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }

    // 连接最后一点
    const lastIndex = points.length - 1;
    if (lastIndex > 0) {
      this.ctx.quadraticCurveTo(
        points[lastIndex - 1][0],
        points[lastIndex - 1][1],
        points[lastIndex][0],
        points[lastIndex][1]
      );
    }

    this.ctx.stroke();
  }

  /**
   * 渲染文本元素
   */
  async drawText(element) {
    const {
      x, y, width, height,
      text, fontSize, fontFamily,
      textAlign, verticalAlign,
      strokeColor, backgroundColor,
      originalText
    } = element;

    if (!text || text.trim() === '') return;

    // 获取字体信息
    const fontInfo = this.getFontInfo(fontFamily || 1);

    // 设置字体
    this.ctx.font = `${fontSize || 20}px ${fontInfo.family}`;
    this.ctx.fillStyle = strokeColor || '#000000';

    // 处理文本对齐
    this.ctx.textAlign = this.getCanvasTextAlign(textAlign || 'left');
    this.ctx.textBaseline = this.getCanvasTextBaseline(verticalAlign || 'top');

    // 处理换行文本
    const lines = this.wrapText(text, width);
    const lineHeight = (fontSize || 20) * 1.2;
    const totalHeight = lines.length * lineHeight;

    // 计算起始Y坐标
    let startY = y;
    if (verticalAlign === 'middle') {
      startY = y + (height - totalHeight) / 2 + lineHeight;
    } else if (verticalAlign === 'bottom') {
      startY = y + height - lines.length * lineHeight + lineHeight;
    } else {
      startY = y + lineHeight;
    }

    // 绘制背景（如果有）
    if (backgroundColor && backgroundColor !== 'transparent') {
      this.ctx.save();
      this.ctx.fillStyle = backgroundColor;
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillRect(x, y - 5, width, totalHeight + 10);
      this.ctx.restore();
    }

    // 绘制每一行文本
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineY = startY + i * lineHeight;

      // 计算X坐标
      let lineX = x;
      if (textAlign === 'center') {
        lineX = x + width / 2;
      } else if (textAlign === 'right') {
        lineX = x + width;
      }

      this.ctx.fillText(line, lineX, lineY);
    }
  }

  /**
   * 渲染图片元素
   */
  async drawImage(element, loadedImages) {
    const { x, y, width, height, fileId, status } = element;

    if (status !== 'saved' || !loadedImages[fileId]) {
      this.drawImagePlaceholder(x, y, width, height);
      return;
    }

    const img = loadedImages[fileId];

    this.ctx.save();

    // 设置裁剪区域
    this.ctx.beginPath();
    this.ctx.rect(x, y, width, height);
    this.ctx.clip();

    // 计算图片缩放和位置
    const { sx, sy, sWidth, sHeight } = this.calculateImageCrop(img, width, height);

    // 绘制图片
    this.ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);

    this.ctx.restore();

    // 绘制边框（如果有）
    if (element.strokeColor && element.strokeWidth > 0) {
      this.ctx.strokeStyle = element.strokeColor;
      this.ctx.lineWidth = element.strokeWidth;
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * 绘制图片占位符
   */
  drawImagePlaceholder(x, y, width, height) {
    this.ctx.save();

    // 背景
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(x, y, width, height);

    // 边框
    this.ctx.strokeStyle = '#d0d0d0';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, width, height);

    // 图标（简单的图片图标）
    this.ctx.fillStyle = '#999';
    this.ctx.setLineDash([]);

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const iconSize = Math.min(width, height) * 0.3;

    // 绘制山脉图标
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - iconSize/2, centerY + iconSize/4);
    this.ctx.lineTo(centerX - iconSize/4, centerY);
    this.ctx.lineTo(centerX, centerY + iconSize/6);
    this.ctx.lineTo(centerX + iconSize/4, centerY - iconSize/6);
    this.ctx.lineTo(centerX + iconSize/2, centerY + iconSize/4);
    this.ctx.lineTo(centerX + iconSize/2, centerY + iconSize/2);
    this.ctx.lineTo(centerX - iconSize/2, centerY + iconSize/2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * 加载图片
   */
  async loadImages(files) {
    const loadedImages = {};

    for (const [fileId, fileData] of Object.entries(files)) {
      try {
        if (fileData.dataURL) {
          loadedImages[fileId] = await this.loadImageFromDataURL(fileData.dataURL);
        } else if (fileData.buffer) {
          loadedImages[fileId] = await this.loadImageFromBuffer(fileData.buffer);
        }
      } catch (error) {
        console.error(`Failed to load image ${fileId}:`, error);
      }
    }

    return loadedImages;
  }

  /**
   * 从DataURL加载图片
   */
  async loadImageFromDataURL(dataURL) {
    const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    return await this.loadImageFromBuffer(buffer);
  }

  /**
   * 从Buffer加载图片
   */
  async loadImageFromBuffer(buffer) {
    // 使用sharp优化图片
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    return await loadImage(optimizedBuffer);
  }

  /**
   * 计算图片裁剪
   */
  calculateImageCrop(img, targetWidth, targetHeight) {
    const imgRatio = img.width / img.height;
    const targetRatio = targetWidth / targetHeight;

    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

    if (imgRatio > targetRatio) {
      // 图片比目标更宽，裁剪宽度
      sWidth = img.height * targetRatio;
      sx = (img.width - sWidth) / 2;
    } else if (imgRatio < targetRatio) {
      // 图片比目标更高，裁剪高度
      sHeight = img.width / targetRatio;
      sy = (img.height - sHeight) / 2;
    }

    return { sx, sy, sWidth, sHeight };
  }

  /**
   * 获取字体信息
   */
  getFontInfo(fontFamily) {
    const fontMap = {
      1: { family: 'Virgil', name: 'Virgil' },
      2: { family: 'Helvetica', name: 'Helvetica' },
      3: { family: 'Cascadia Code', name: 'Cascadia Code' },
      4: { family: 'Assistant', name: 'Assistant' }
    };

    return fontMap[fontFamily] || fontMap[1];
  }

  /**
   * 获取Canvas文本对齐
   */
  getCanvasTextAlign(excalidrawAlign) {
    const alignMap = {
      'left': 'left',
      'center': 'center',
      'right': 'right'
    };
    return alignMap[excalidrawAlign] || 'left';
  }

  /**
   * 获取Canvas文本基线
   */
  getCanvasTextBaseline(excalidrawBaseline) {
    const baselineMap = {
      'top': 'top',
      'middle': 'middle',
      'bottom': 'bottom'
    };
    return baselineMap[excalidrawBaseline] || 'top';
  }

  /**
   * 文本换行处理
   */
  wrapText(text, maxWidth) {
    if (!text || text.trim() === '') return [''];

    // 如果文本中没有换行符，检查是否需要自动换行
    if (!text.includes('\n')) {
      const metrics = this.ctx.measureText(text);

      if (metrics.width <= maxWidth) {
        return [text];
      }

      return this.wrapTextByWords(text, maxWidth);
    }

    // 处理已有换行符的文本
    const lines = text.split('\n');
    const wrappedLines = [];

    for (const line of lines) {
      if (line.trim() === '') {
        wrappedLines.push('');
        continue;
      }

      const metrics = this.ctx.measureText(line);

      if (metrics.width <= maxWidth) {
        wrappedLines.push(line);
      } else {
        wrappedLines.push(...this.wrapTextByWords(line, maxWidth));
      }
    }

    return wrappedLines;
  }

  /**
   * 按单词换行
   */
  wrapTextByWords(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  /**
   * 添加粗糙效果
   */
  addRoughness(element) {
    // 简化的粗糙效果实现
    // 这里可以根据需要添加更复杂的粗糙效果算法
  }

  /**
   * 优化元素
   */
  optimizeElements(elements) {
    return elements.filter(element => {
      // 移除已删除的元素
      if (element.isDeleted) return false;

      // 检查元素是否在画布可见区域内
      const isVisible = this.isElementVisible(element);
      return isVisible;
    });
  }

  /**
   * 检查元素是否可见
   */
  isElementVisible(element) {
    const { x, y, width, height } = element;

    return x + width > 0 &&
           y + height > 0 &&
           x < this.width &&
           y < this.height;
  }

  /**
   * 按z-index排序元素
   */
  sortElementsByZIndex(elements) {
    return elements.sort((a, b) => {
      // 首先按类型排序
      const typeOrder = {
        'rectangle': 0,
        'ellipse': 0,
        'diamond': 0,
        'line': 1,
        'arrow': 1,
        'freedraw': 1,
        'image': 2,
        'text': 3,
        'magicframe': 4
      };

      const typeA = typeOrder[a.type] || 0;
      const typeB = typeOrder[b.type] || 0;

      if (typeA !== typeB) {
        return typeA - typeB;
      }

      // 然后按ID排序（Excalidraw按创建时间排序）
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * 输出为Buffer
   */
  toBuffer(format = 'png', quality = 90) {
    if (format === 'jpeg') {
      return this.canvas.toBuffer('image/jpeg', { quality: quality / 100 });
    } else if (format === 'webp') {
      return this.canvas.toBuffer('image/webp', { quality: quality / 100 });
    } else {
      return this.canvas.toBuffer('image/png');
    }
  }

  /**
   * 输出为DataURL
   */
  toDataURL(format = 'png') {
    return this.canvas.toDataURL(`image/${format}`);
  }

  /**
   * 重置画布
   */
  reset() {
    this.canvas = createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
    this.setupDefaultContext();
  }

  /**
   * 清理资源
   */
  destroy() {
    this.imageCache.clear();
    this.fontMetricsCache.clear();
    this.canvas = null;
    this.ctx = null;
  }
}

module.exports = { ExcalidrawCanvasRenderer };
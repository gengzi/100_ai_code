const { ExcalidrawCanvasRenderer } = require('./excalidraw-renderer');

/**
 * 渲染器池管理类
 * 负责管理多个渲染器实例，支持并发渲染
 */
class RendererPool {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 5;
    this.minSize = options.minSize || 1;
    this.pool = [];
    this.activeRenderers = 0;
    this.waitingQueue = [];
    this.renderCount = 0;
    this.errorCount = 0;

    // 性能统计
    this.stats = {
      created: 0,
      reused: 0,
      destroyed: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity
    };

    // 初始化最小数量的渲染器
    this.initialize();
  }

  /**
   * 初始化渲染器池
   */
  async initialize() {
    for (let i = 0; i < this.minSize; i++) {
      const renderer = new ExcalidrawCanvasRenderer();
      this.pool.push(renderer);
      this.stats.created++;
    }
  }

  /**
   * 获取一个渲染器
   * @returns {Promise<ExcalidrawCanvasRenderer>} 渲染器实例
   */
  async getRenderer() {
    return new Promise((resolve, reject) => {
      // 如果池中有可用的渲染器，直接返回
      if (this.pool.length > 0) {
        const renderer = this.pool.pop();
        this.activeRenderers++;
        this.stats.reused++;
        resolve(renderer);
        return;
      }

      // 如果还能创建新的渲染器
      if (this.activeRenderers < this.maxSize) {
        this.createRenderer()
          .then(renderer => {
            this.activeRenderers++;
            this.stats.created++;
            resolve(renderer);
          })
          .catch(reject);
        return;
      }

      // 如果达到最大限制，加入等待队列
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.indexOf(resolve);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
          reject(new Error('获取渲染器超时'));
        }
      }, 30000); // 30秒超时

      this.waitingQueue.push((renderer) => {
        clearTimeout(timeout);
        resolve(renderer);
      });
    });
  }

  /**
   * 创建新的渲染器实例
   * @returns {Promise<ExcalidrawCanvasRenderer>} 渲染器实例
   */
  async createRenderer() {
    try {
      const renderer = new ExcalidrawCanvasRenderer();
      return renderer;
    } catch (error) {
      console.error('创建渲染器失败:', error);
      throw new Error(`创建渲染器失败: ${error.message}`);
    }
  }

  /**
   * 释放渲染器回池
   * @param {ExcalidrawCanvasRenderer} renderer - 要释放的渲染器
   */
  releaseRenderer(renderer) {
    if (!renderer) return;

    this.activeRenderers--;

    // 如果有等待的请求，直接分配给等待者
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift();
      this.activeRenderers++;
      next(renderer);
      return;
    }

    // 如果池未满，重置并放回池中
    if (this.pool.length < this.maxSize) {
      try {
        // 重置渲染器状态
        renderer.reset();
        this.pool.push(renderer);
      } catch (error) {
        console.error('重置渲染器失败:', error);
        this.destroyRenderer(renderer);
      }
    } else {
      // 池已满，销毁多余的渲染器
      this.destroyRenderer(renderer);
    }
  }

  /**
   * 销毁渲染器
   * @param {ExcalidrawCanvasRenderer} renderer - 要销毁的渲染器
   */
  destroyRenderer(renderer) {
    try {
      if (renderer && typeof renderer.destroy === 'function') {
        renderer.destroy();
      }
      this.stats.destroyed++;
    } catch (error) {
      console.error('销毁渲染器失败:', error);
    }
  }

  /**
   * 执行渲染任务
   * @param {Object} excalidrawData - Excalidraw数据
   * @param {Object} options - 渲染选项
   * @returns {Promise<Buffer>} 渲染结果
   */
  async render(excalidrawData, options = {}) {
    const startTime = Date.now();
    let renderer = null;

    try {
      // 获取渲染器
      renderer = await this.getRenderer();

      // 设置渲染器尺寸（如果指定）
      if (options.width && options.height) {
        renderer.width = options.width;
        renderer.height = options.height;
        renderer.reset();
      }

      // 执行渲染
      await renderer.render(excalidrawData, options);

      // 输出为Buffer
      const buffer = renderer.toBuffer(options.format || 'png', options.quality || 90);

      // 更新统计
      const renderTime = Date.now() - startTime;
      this.updateStats(renderTime);

      return buffer;

    } catch (error) {
      this.errorCount++;
      throw error;
    } finally {
      // 释放渲染器
      if (renderer) {
        this.releaseRenderer(renderer);
      }
    }
  }

  /**
   * 更新性能统计
   * @param {number} renderTime - 渲染时间（毫秒）
   */
  updateStats(renderTime) {
    this.stats.totalRenders++;
    this.stats.maxRenderTime = Math.max(this.stats.maxRenderTime, renderTime);
    this.stats.minRenderTime = Math.min(this.stats.minRenderTime, renderTime);

    // 计算平均渲染时间
    const totalTime = this.stats.averageRenderTime * (this.stats.totalRenders - 1) + renderTime;
    this.stats.averageRenderTime = Math.round(totalTime / this.stats.totalRenders);
  }

  /**
   * 获取池状态信息
   * @returns {Object} 池状态
   */
  getStatus() {
    return {
      pool: {
        size: this.pool.length,
        active: this.activeRenderers,
        waiting: this.waitingQueue.length,
        maxSize: this.maxSize,
        minSize: this.minSize
      },
      stats: {
        ...this.stats,
        successRate: this.stats.totalRenders > 0 ?
          ((this.stats.totalRenders - this.errorCount) / this.stats.totalRenders * 100).toFixed(2) + '%' : 'N/A'
      },
      performance: {
        averageRenderTime: this.stats.averageRenderTime,
        maxRenderTime: this.stats.maxRenderTime,
        minRenderTime: this.stats.minRenderTime === Infinity ? 0 : this.stats.minRenderTime
      }
    };
  }

  /**
   * 清理池
   */
  async clear() {
    // 销毁池中的所有渲染器
    for (const renderer of this.pool) {
      this.destroyRenderer(renderer);
    }
    this.pool = [];

    // 取消所有等待的请求
    for (const resolve of this.waitingQueue) {
      resolve(null);
    }
    this.waitingQueue = [];

    this.activeRenderers = 0;
  }

  /**
   * 健康检查
   * @returns {Object} 健康状态
   */
  healthCheck() {
    const status = this.getStatus();
    const isHealthy =
      this.activeRenderers <= this.maxSize &&
      this.waitingQueue.length < 10 && // 等待队列不能太长
      (this.stats.totalRenders === 0 || this.errorCount / this.stats.totalRenders < 0.1); // 错误率低于10%

    return {
      healthy: isHealthy,
      ...status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 扩展池大小
   * @param {number} newSize - 新的最大大小
   */
  async expandPool(newSize) {
    if (newSize <= this.maxSize) {
      return;
    }

    this.maxSize = newSize;

    // 如果当前活跃渲染器很多，创建一些额外的渲染器
    const neededAdditional = Math.min(
      newSize - this.pool.length - this.activeRenderers,
      this.minSize
    );

    for (let i = 0; i < neededAdditional; i++) {
      try {
        const renderer = await this.createRenderer();
        this.pool.push(renderer);
        this.stats.created++;
      } catch (error) {
        console.error('扩展池失败:', error);
      }
    }
  }

  /**
   * 收缩池大小
   * @param {number} newSize - 新的最大大小
   */
  async shrinkPool(newSize) {
    if (newSize >= this.maxSize) {
      return;
    }

    this.maxSize = newSize;

    // 销毁多余的渲染器
    while (this.pool.length > Math.min(newSize, this.minSize)) {
      const renderer = this.pool.pop();
      this.destroyRenderer(renderer);
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      created: 0,
      reused: 0,
      destroyed: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity
    };
    this.errorCount = 0;
  }

  /**
   * 获取详细的性能报告
   * @returns {Object} 性能报告
   */
  getPerformanceReport() {
    const status = this.getStatus();

    return {
      summary: {
        totalRenderers: status.pool.active + status.pool.size,
        activeRenderers: status.pool.active,
        idleRenderers: status.pool.size,
        waitingRequests: status.pool.waiting,
        poolUtilization: ((status.pool.active / this.maxSize) * 100).toFixed(1) + '%'
      },
      performance: status.performance,
      statistics: status.stats,
      recommendations: this.generateRecommendations(status)
    };
  }

  /**
   * 生成性能优化建议
   * @param {Object} status - 池状态
   * @returns {Array} 建议列表
   */
  generateRecommendations(status) {
    const recommendations = [];

    if (status.pool.waiting > 5) {
      recommendations.push('等待队列过长，建议增加池大小或优化渲染速度');
    }

    if (status.performance.averageRenderTime > 5000) {
      recommendations.push('平均渲染时间较长，建议优化渲染算法或增加并发处理能力');
    }

    if (parseFloat(status.stats.successRate) < 90) {
      recommendations.push('渲染成功率较低，建议检查输入数据和错误处理逻辑');
    }

    if (status.pool.utilization > 80) {
      recommendations.push('池利用率较高，建议增加池大小以改善响应时间');
    }

    if (recommendations.length === 0) {
      recommendations.push('当前配置运行良好，无需特别优化');
    }

    return recommendations;
  }
}

module.exports = { RendererPool };
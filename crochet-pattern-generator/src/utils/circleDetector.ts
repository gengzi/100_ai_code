import { YarnColor } from '../types';

export interface CircleDetectionResult {
  isCircular: boolean;
  confidence: number;
  center?: { x: number; y: number };
  radius?: number;
  recommendation?: string;
}

export class CircleDetector {
  /**
   * 检测颜色网格中的圆形图案
   */
  detectCircularPattern(colorGrid: (YarnColor | null)[][]): CircleDetectionResult {
    if (!colorGrid.length || !colorGrid[0].length) {
      return { isCircular: false, confidence: 0 };
    }

    const height = colorGrid.length;
    const width = colorGrid[0].length;

    // 1. 分析非空颜色的分布
    const colorPoints = this.extractColorPoints(colorGrid);

    if (colorPoints.length < 10) {
      return { isCircular: false, confidence: 0 };
    }

    // 2. 计算中心点和半径
    const center = this.calculateCenter(colorPoints);
    const avgRadius = this.calculateAverageRadius(colorPoints, center);

    // 3. 检测圆形度
    const circularity = this.calculateCircularity(colorPoints, center, avgRadius);

    // 4. 检测径向对称性
    const radialSymmetry = this.calculateRadialSymmetry(colorGrid, center, avgRadius);

    // 5. 综合评估
    const confidence = (circularity * 0.6 + radialSymmetry * 0.4);

    const result: CircleDetectionResult = {
      isCircular: confidence > 0.6,
      confidence,
      center,
      radius: avgRadius
    };

    if (result.isCircular) {
      result.recommendation = this.generateRecommendation(confidence, avgRadius, width, height);
    }

    return result;
  }

  /**
   * 提取有颜色的点
   */
  private extractColorPoints(colorGrid: (YarnColor | null)[][]): Array<{x: number, y: number}> {
    const points: Array<{x: number, y: number}> = [];

    for (let y = 0; y < colorGrid.length; y++) {
      for (let x = 0; x < colorGrid[y].length; x++) {
        if (colorGrid[y][x]) {
          points.push({ x, y });
        }
      }
    }

    return points;
  }

  /**
   * 计算颜色分布的中心点
   */
  private calculateCenter(points: Array<{x: number, y: number}>): {x: number, y: number} {
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);

    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  }

  /**
   * 计算平均半径
   */
  private calculateAverageRadius(
    points: Array<{x: number, y: number}>,
    center: {x: number, y: number}
  ): number {
    const distances = points.map(p =>
      Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
    );

    return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  /**
   * 计算圆形度 - 点到平均半径的方差
   */
  private calculateCircularity(
    points: Array<{x: number, y: number}>,
    center: {x: number, y: number},
    avgRadius: number
  ): number {
    const distances = points.map(p =>
      Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
    );

    const variance = distances.reduce((sum, d) => {
      return sum + Math.pow(d - avgRadius, 2);
    }, 0) / distances.length;

    const standardDeviation = Math.sqrt(variance);

    // 标准差越小，圆形度越高
    return Math.max(0, 1 - (standardDeviation / avgRadius));
  }

  /**
   * 计算径向对称性
   */
  private calculateRadialSymmetry(
    colorGrid: (YarnColor | null)[][],
    center: {x: number, y: number},
    radius: number
  ): number {
    const angles = 8; // 检查8个方向
    let symmetrySum = 0;

    for (let i = 0; i < angles; i++) {
      const angle1 = (i * 2 * Math.PI) / angles;
      const angle2 = ((i + angles/2) * 2 * Math.PI) / angles;

      const ray1 = this.extractRay(colorGrid, center, angle1, radius);
      const ray2 = this.extractRay(colorGrid, center, angle2, radius);

      symmetrySum += this.compareRays(ray1, ray2);
    }

    return symmetrySum / angles;
  }

  /**
   * 提取从中心点向某个方向的射线上的颜色分布
   */
  private extractRay(
    colorGrid: (YarnColor | null)[][],
    center: {x: number, y: number},
    angle: number,
    maxRadius: number
  ): Array<YarnColor | null> {
    const ray: Array<YarnColor | null> = [];

    for (let r = 0; r < maxRadius; r++) {
      const x = Math.round(center.x + r * Math.cos(angle));
      const y = Math.round(center.y + r * Math.sin(angle));

      if (y >= 0 && y < colorGrid.length && x >= 0 && x < colorGrid[0].length) {
        ray.push(colorGrid[y][x]);
      } else {
        ray.push(null);
      }
    }

    return ray;
  }

  /**
   * 比较两条射线的相似性
   */
  private compareRays(ray1: Array<YarnColor | null>, ray2: Array<YarnColor | null>): number {
    let similarities = 0;
    const maxLength = Math.max(ray1.length, ray2.length);

    for (let i = 0; i < maxLength; i++) {
      const color1 = ray1[i] || ray1[ray1.length - 1];
      const color2 = ray2[i] || ray2[ray2.length - 1];

      if (color1 && color2) {
        if (color1.id === color2.id) {
          similarities++;
        }
      } else if (!color1 && !color2) {
        similarities++;
      }
    }

    return similarities / maxLength;
  }

  /**
   * 生成钩织建议
   */
  private generateRecommendation(
    confidence: number,
    radius: number,
    gridWidth: number,
    gridHeight: number
  ): string {
    const relativeSize = radius / Math.min(gridWidth, gridHeight);

    let recommendation = `检测到圆形图案（置信度：${Math.round(confidence * 100)}%）。`;

    if (relativeSize > 0.7) {
      recommendation += '建议使用环形起针法进行圈钩织，这样可以获得最佳的圆形效果。';
    } else if (relativeSize > 0.3) {
      recommendation += '推荐使用魔法圈起针，从中心向外钩织。';
    } else {
      recommendation += '可以使用锁针起针，但圈钩织效果会更好。';
    }

    recommendation += `预计半径约${Math.round(radius)}格。`;

    return recommendation;
  }

  /**
   * 检测多个圆形（用于复杂图案）
   */
  detectMultipleCircles(colorGrid: (YarnColor | null)[][]): CircleDetectionResult[] {
    // 简化实现：使用颜色聚类来检测多个可能的圆形
    const colorGroups = this.groupColorsByProximity(colorGrid);
    const results: CircleDetectionResult[] = [];

    for (const group of colorGroups) {
      if (group.length >= 5) { // 至少需要5个点才考虑检测圆形
        const subGrid = this.createSubGrid(colorGrid, group);
        const detection = this.detectCircularPattern(subGrid);

        if (detection.isCircular) {
          results.push(detection);
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 根据临近性对颜色点进行分组
   */
  private groupColorsByProximity(colorGrid: (YarnColor | null)[][]): Array<Array<{x: number, y: number}>> {
    const points = this.extractColorPoints(colorGrid);
    const groups: Array<Array<{x: number, y: number}>> = [];
    const visited = new Set<string>();

    for (const point of points) {
      const key = `${point.x},${point.y}`;

      if (!visited.has(key)) {
        const group = this.findNearbyPoints(point, points, visited, 5); // 距离阈值
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * 查找临近的点
   */
  private findNearbyPoints(
    start: {x: number, y: number},
    points: Array<{x: number, y: number}>,
    visited: Set<string>,
    threshold: number
  ): Array<{x: number, y: number}> {
    const group: Array<{x: number, y: number}> = [];
    const toVisit = [start];

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;

      visited.add(key);
      group.push(current);

      // 查找临近点
      for (const point of points) {
        const pointKey = `${point.x},${point.y}`;
        if (!visited.has(pointKey)) {
          const distance = Math.sqrt(
            Math.pow(current.x - point.x, 2) +
            Math.pow(current.y - point.y, 2)
          );

          if (distance <= threshold) {
            toVisit.push(point);
          }
        }
      }
    }

    return group;
  }

  /**
   * 为颜色组创建子网格
   */
  private createSubGrid(
    fullGrid: (YarnColor | null)[][],
    points: Array<{x: number, y: number}>
  ): (YarnColor | null)[][] {
    if (points.length === 0) return [[]];

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const subGrid: (YarnColor | null)[][] = Array(height).fill(null).map(() => Array(width).fill(null));

    for (const point of points) {
      subGrid[point.y - minY][point.x - minX] = fullGrid[point.y][point.x];
    }

    return subGrid;
  }
}

export const circleDetector = new CircleDetector();
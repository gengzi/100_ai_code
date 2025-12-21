import { describe, it, expect } from 'vitest';
import { createEmptyFlow, createFlowNode, replaceVariables } from './flow';

describe('Flow Utils', () => {
  describe('createEmptyFlow', () => {
    it('应该创建一个空流程', () => {
      const flow = createEmptyFlow();

      expect(flow.id).toBeDefined();
      expect(flow.name).toBe('未命名流程');
      expect(flow.description).toBe('');
      expect(flow.nodes).toEqual([]);
      expect(flow.edges).toEqual([]);
      expect(flow.variables).toEqual([]);
      expect(flow.globalHeaders).toEqual([]);
      expect(flow.globalParams).toEqual([]);
      expect(flow.runConfig).toEqual({
        scenario: 'all',
        timeoutMs: 8000,
        retries: 0
      });
    });

    it('应该创建唯一ID', () => {
      const flow1 = createEmptyFlow();
      const flow2 = createEmptyFlow();

      expect(flow1.id).not.toBe(flow2.id);
    });
  });

  describe('createFlowNode', () => {
    it('应该创建HTTP节点', () => {
      const node = createFlowNode('http', 'Test Node', { x: 100, y: 200 });

      expect(node.id).toBeDefined();
      expect(node.type).toBe('http');
      expect(node.name).toBe('Test Node');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.config).toEqual({
        method: 'GET',
        url: '',
        headers: [],
        body: '',
        authToken: '',
        assertStatus: [200],
        outputMappings: []
      });
    });

    it('应该创建条件节点', () => {
      const node = createFlowNode('condition', 'Condition', { x: 0, y: 0 });

      expect(node.type).toBe('condition');
      expect(node.config).toEqual({
        expression: ''
      });
    });

    it('应该创建唯一节点ID', () => {
      const node1 = createFlowNode('http', 'Node 1', { x: 0, y: 0 });
      const node2 = createFlowNode('http', 'Node 2', { x: 0, y: 0 });

      expect(node1.id).not.toBe(node2.id);
    });
  });

  describe('replaceVariables', () => {
    it('应该替换简单的变量', () => {
      const variables = [
        { key: 'name', value: 'John' },
        { key: 'age', value: '30' }
      ];

      const result = replaceVariables('Hello {{name}}, you are {{age}} years old', variables);
      expect(result).toBe('Hello John, you are 30 years old');
    });

    it('应该处理不存在的变量', () => {
      const variables = [
        { key: 'name', value: 'John' }
      ];

      const result = replaceVariables('Hello {{unknown}}, I am {{name}}', variables);
      expect(result).toBe('Hello , I am John');
    });

    it('应该处理空变量列表', () => {
      const result = replaceVariables('Hello {{name}}', []);
      expect(result).toBe('Hello ');
    });

    it('应该处理重复变量', () => {
      const variables = [
        { key: 'name', value: 'John' }
      ];

      const result = replaceVariables('{{name}} says hello to {{name}}', variables);
      expect(result).toBe('John says hello to John');
    });
  });
});
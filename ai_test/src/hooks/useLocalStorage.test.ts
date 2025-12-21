import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
  });

  it('应该返回初始值', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('initial-value');
  });

  it('应该从localStorage读取已存在的值', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('应该更新localStorage值', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('应该使用函数更新值', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(1));
  });

  it('应该处理JSON解析错误', () => {
    // Mock console.warn to avoid test output noise
    const originalWarn = console.warn;
    console.warn = vi.fn();

    localStorage.setItem('test-key', 'invalid-json');

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback-value'));

    expect(result.current[0]).toBe('fallback-value');
    expect(console.warn).toHaveBeenCalled();

    // Restore console.warn
    console.warn = originalWarn;
  });

  it('应该处理undefined值', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));

    act(() => {
      result.current[1](undefined as any);
    });

    expect(result.current[0]).toBeUndefined();
    expect(localStorage.getItem('test-key')).toBeNull();
  });
});
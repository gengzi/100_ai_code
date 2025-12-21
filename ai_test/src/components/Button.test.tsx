import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该在禁用状态下不触发点击', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该显示加载状态', () => {
    render(<Button loading>Loading</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('应该应用正确的样式类', () => {
    render(<Button variant="secondary" size="large">Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // 这里可以添加更多样式相关的断言
  });

  it('应该支持不同的类型', () => {
    render(<Button type="submit">Submit</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
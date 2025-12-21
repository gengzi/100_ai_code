interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    fontWeight: '500',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1,
  };

  const sizeStyles = {
    small: {
      padding: '4px 8px',
      fontSize: '12px',
      height: '24px'
    },
    medium: {
      padding: '6px 12px',
      fontSize: '14px',
      height: '32px'
    },
    large: {
      padding: '8px 16px',
      fontSize: '16px',
      height: '40px'
    }
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#1890ff',
      color: '#fff',
    },
    secondary: {
      backgroundColor: '#f0f0f0',
      color: '#262626',
    },
    danger: {
      backgroundColor: '#ff4d4f',
      color: '#fff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#1890ff',
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      type={type}
      style={combinedStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading && (
        <span
          style={{
            width: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
            height: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
            border: '2px solid transparent',
            borderTop: `2px solid ${variant === 'ghost' ? '#1890ff' : '#fff'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {children}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
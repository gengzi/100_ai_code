interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'medium', text = '加载中...' }) => {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '20px'
    }}>
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {text && <span style={{ color: '#666' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loading;
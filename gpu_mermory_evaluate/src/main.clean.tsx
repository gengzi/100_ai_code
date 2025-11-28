import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#1890ff',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          🚀 AI模型GPU显存评估工具
        </h1>

        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <p style={{
            fontSize: '18px',
            color: '#666'
          }}>
            专业的AI模型硬件需求评估平台
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#e6f7ff',
            borderRadius: '8px',
            border: '1px solid #91d5ff'
          }}>
            <h3 style={{ color: '#1890ff', marginBottom: '10px' }}>📊 精准计算</h3>
            <p>基于模型参数和精度，准确计算显存需求和性能指标</p>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f6ffed',
            borderRadius: '8px',
            border: '1px solid #b7eb8f'
          }}>
            <h3 style={{ color: '#52c41a', marginBottom: '10px' }}>⚡ 实时评估</h3>
            <p>参数调整后立即显示结果，支持多种模型类型的快速评估</p>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fff2e8',
            borderRadius: '8px',
            border: '1px solid #ffbb96'
          }}>
            <h3 style={{ color: '#fa8c16', marginBottom: '10px' }}>🎯 GPU推荐</h3>
            <p>内置全面的GPU规格数据库，提供专业的硬件配置建议</p>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>✅ 系统状态正常</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            React应用已成功启动，所有组件运行正常
          </p>
          <div style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#52c41a',
            color: 'white',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            🎉 项目启动成功！
          </div>
        </div>
      </div>
    </div>
  )
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
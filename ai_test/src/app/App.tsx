import { Suspense } from "react";
import FlowWorkbench from "../pages/FlowWorkbench";
import ErrorBoundary from "../components/ErrorBoundary";
import Loading from "../components/Loading";

const App = () => {
  return (
    <ErrorBoundary>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <header
          style={{
            borderBottom: "1px solid #e8e8e8",
            padding: "12px 24px",
            backgroundColor: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#262626",
            }}
          >
            AI接口联调平台
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12px",
              color: "#8c8c8c",
            }}
          >
            可视化流程编辑 · 接口测试调试 · 一键导出配置
          </p>
        </header>

        <main style={{ flex: 1, overflow: "hidden", padding: "16px" }}>
          <Suspense fallback={<Loading size="large" text="正在加载工作台..." />}>
            <FlowWorkbench />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;

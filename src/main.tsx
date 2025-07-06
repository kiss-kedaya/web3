import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 导入OKX数据解析测试（仅在开发环境）
if (import.meta.env.DEV) {
  import('./utils/okxDataTest.ts');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
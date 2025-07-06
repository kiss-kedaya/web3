import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface InputDataViewerProps {
  inputData: string;
  className?: string;
  truncateLength?: number;
}

export const InputDataViewer: React.FC<InputDataViewerProps> = ({
  inputData,
  className = '',
  truncateLength = 32
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 检查是否有实际的输入数据（不只是 "0x"）
  const hasInputData = inputData && inputData !== '0x' && inputData.length > 2;
  
  // 格式化输入数据显示
  const formatInputData = (data: string, shouldTruncate: boolean = true) => {
    if (!data || data === '0x') {
      return '0x';
    }

    if (shouldTruncate && data.length > truncateLength + 2) {
      return `${data.slice(0, truncateLength + 2)}...`;
    }

    return data;
  };

  // 处理复制功能
  const handleCopy = async () => {
    try {
      await copyToClipboard(inputData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 切换展开/收起状态
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 格式化完整数据显示（添加换行）
  const formatFullData = (data: string) => {
    if (!data || data.length <= 66) {
      return data;
    }

    // 每64个字符（32字节）换行，保留0x前缀
    const hex = data.slice(2);
    const chunks = hex.match(/.{1,64}/g) || [];
    return '0x' + chunks.join('\n');
  };

  return (
    <div className={className}>
      <label className="text-xs text-gray-400 block mb-1">输入数据</label>
      
      {!hasInputData ? (
        <div className="text-sm text-gray-500">0x (无输入数据)</div>
      ) : (
        <div className="space-y-2">
          {/* 缩略显示区域 */}
          <div className="relative bg-gray-800/30 rounded px-3 py-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 text-sm text-white font-mono break-all min-w-0">
                {formatInputData(inputData, !isExpanded)}
              </div>

              {/* 操作按钮 - 紧贴文本内容右侧 */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {/* 复制按钮 */}
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded transition-colors ${
                    copySuccess
                      ? 'text-green-400 bg-green-900/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title="复制完整输入数据"
                >
                  <Copy size={12} />
                </button>

                {/* 展开/收起按钮 */}
                {inputData.length > truncateLength + 2 && (
                  <button
                    onClick={toggleExpanded}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={isExpanded ? '收起' : '展开完整数据'}
                  >
                    {isExpanded ? (
                      <EyeOff size={12} />
                    ) : (
                      <Eye size={12} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 展开的完整数据显示 */}
          {isExpanded && inputData.length > truncateLength + 2 && (
            <div className="mt-2 p-3 bg-gray-800 rounded border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">完整输入数据 ({inputData.length} 字符)</span>
                <button
                  onClick={toggleExpanded}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="收起"
                >
                  <ChevronUp size={14} />
                </button>
              </div>
              
              <div className="text-sm text-white font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                {formatFullData(inputData)}
              </div>
              
              {/* 数据分析信息 */}
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">字节长度: </span>
                    <span className="text-white">{(inputData.length - 2) / 2} bytes</span>
                  </div>
                  <div>
                    <span className="text-gray-400">方法ID: </span>
                    <span className="text-white">
                      {inputData.length >= 10 ? inputData.slice(0, 10) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 复制成功提示 */}
          {copySuccess && (
            <div className="text-xs text-green-400 flex items-center space-x-1">
              <span>✓ 已复制到剪贴板</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

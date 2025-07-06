import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff } from 'lucide-react';
import { TransactionLog, LogDisplayFormat } from '../types/web3';
import { copyToClipboard } from '../utils/clipboard';

interface TransactionLogsViewerProps {
  logs: TransactionLog[];
  logCount: number;
  isLoading?: boolean;
  onLoadLogs?: () => void;
  className?: string;
}

export const TransactionLogsViewer: React.FC<TransactionLogsViewerProps> = ({
  logs,
  logCount,
  isLoading = false,
  onLoadLogs,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayFormat, setDisplayFormat] = useState<LogDisplayFormat>('raw');
  const [expandedLogIndex, setExpandedLogIndex] = useState<number | null>(null);

  const handleLogCountClick = () => {
    if (!isExpanded && logs.length === 0 && onLoadLogs) {
      onLoadLogs();
    }
    setIsExpanded(!isExpanded);
  };

  const handleCopyLog = async (log: TransactionLog, format: LogDisplayFormat) => {
    let content = '';
    
    switch (format) {
      case 'raw':
        content = JSON.stringify(log, null, 2);
        break;
      case 'decoded':
        content = `Address: ${log.address}\nData: ${log.data}\nTopics: ${log.topics.join(', ')}`;
        break;
      case 'topics':
        content = log.topics.join('\n');
        break;
    }
    
    await copyToClipboard(content);
  };

  const formatLogData = (log: TransactionLog, format: LogDisplayFormat) => {
    switch (format) {
      case 'raw':
        return JSON.stringify(log, null, 2);
      case 'decoded':
        return {
          address: log.address,
          data: log.data,
          topics: log.topics,
          blockNumber: log.blockNumber,
          transactionIndex: log.transactionIndex,
          logIndex: log.logIndex
        };
      case 'topics':
        return log.topics;
      default:
        return log;
    }
  };

  const renderLogContent = (log: TransactionLog, index: number) => {
    const isLogExpanded = expandedLogIndex === index;
    const formattedData = formatLogData(log, displayFormat);

    return (
      <div key={index} className="border border-gray-600 rounded-md">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700 transition-colors"
          onClick={() => setExpandedLogIndex(isLogExpanded ? null : index)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-300">日志 #{index}</span>
            <span className="text-xs text-gray-500">({log.address.slice(0, 10)}...)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLog(log, displayFormat);
              }}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="复制日志数据"
            >
              <Copy size={14} />
            </button>
            {isLogExpanded ? (
              <EyeOff size={16} className="text-gray-400" />
            ) : (
              <Eye size={16} className="text-gray-400" />
            )}
          </div>
        </div>
        
        {isLogExpanded && (
          <div className="border-t border-gray-600 p-3 bg-gray-800">
            {displayFormat === 'raw' && (
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
                {formattedData}
              </pre>
            )}
            
            {displayFormat === 'decoded' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">合约地址</label>
                  <div className="text-sm text-white font-mono">{log.address}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">数据</label>
                  <div className="text-sm text-white font-mono break-all">{log.data}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">主题 ({log.topics.length})</label>
                  <div className="space-y-1">
                    {log.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="text-sm text-white font-mono break-all">
                        [{topicIndex}] {topic}
                      </div>
                    ))}
                  </div>
                </div>
                {log.logIndex !== undefined && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">日志索引</label>
                    <div className="text-sm text-white">{log.logIndex}</div>
                  </div>
                )}
              </div>
            )}
            
            {displayFormat === 'topics' && (
              <div className="space-y-1">
                {log.topics.map((topic, topicIndex) => (
                  <div key={topicIndex} className="text-sm text-white font-mono break-all">
                    <span className="text-gray-400">[{topicIndex}]</span> {topic}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* 日志数量点击区域 */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">日志数量</label>
        <button
          onClick={handleLogCountClick}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
          disabled={isLoading}
        >
          <span>{logCount}</span>
          {isLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
          ) : (
            <>
              {isExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </>
          )}
        </button>
      </div>

      {/* 展开的日志内容 */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 格式切换按钮 */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">显示格式:</span>
            <div className="flex space-x-1">
              {(['raw', 'decoded', 'topics'] as LogDisplayFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setDisplayFormat(format)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    displayFormat === format
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {format === 'raw' && 'Raw'}
                  {format === 'decoded' && 'Decoded'}
                  {format === 'topics' && 'Topics'}
                </button>
              ))}
            </div>
          </div>

          {/* 日志列表 */}
          {logs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => renderLogContent(log, index))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-4">
              {isLoading ? '正在加载日志数据...' : '暂无日志数据'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

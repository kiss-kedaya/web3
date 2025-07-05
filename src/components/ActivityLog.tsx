import React from 'react';
import { Activity, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ActivityLog as ActivityLogType, NetworkConfig } from '../types/web3';
import { getExplorerUrl } from '../utils/networks';

interface ActivityLogProps {
  logs: ActivityLogType[];
  currentNetwork: NetworkConfig | null;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, currentNetwork }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'error':
        return <XCircle className="text-red-400" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      default:
        return <Activity className="text-gray-400" size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'text-blue-400';
      case 'contract':
        return 'text-yellow-400';
      case 'signature':
        return 'text-purple-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return '交易';
      case 'contract':
        return '合约';
      case 'signature':
        return '签名';
      case 'error':
        return '错误';
      default:
        return type;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="text-green-400" size={20} />
        <h3 className="text-lg font-semibold text-white">活动日志</h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无活动</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-3 bg-gray-700 rounded-md"
            >
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(log.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium uppercase ${getTypeColor(log.type)}`}>
                    {getTypeLabel(log.type)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-white mt-1">{log.message}</p>
                
                {log.txHash && currentNetwork && (
                  <div className="flex items-center space-x-2 mt-2">
                    <a
                      href={getExplorerUrl(currentNetwork, log.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <span>在浏览器中查看</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
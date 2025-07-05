import React, { useState } from 'react';
import { NetworkConfig } from '../types/web3';
import { NetworkSelector } from './NetworkSelector';
import { PrivateKeyInput } from './PrivateKeyInput';
import { isValidPrivateKey } from '../utils/crypto';
import { getDefaultNetwork, NETWORKS } from '../utils/networks';
import { Wallet, WifiOff, Wifi, Settings } from 'lucide-react';

interface ConnectionPanelProps {
  isConnected: boolean;
  currentNetwork: NetworkConfig | null;
  onConnect: (privateKey: string, network: NetworkConfig) => Promise<void>;
  onDisconnect: () => void;
  onSwitchNetwork: (network: NetworkConfig) => Promise<void>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  isConnected,
  currentNetwork,
  onConnect,
  onDisconnect,
  onSwitchNetwork
}) => {
  const [privateKey, setPrivateKey] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(getDefaultNetwork());
  const [customRpcUrl, setCustomRpcUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  const handleConnect = async () => {
    if (!privateKey || !selectedNetwork) return;

    setIsConnecting(true);
    try {
      const networkToUse = customRpcUrl
        ? { ...selectedNetwork, rpcUrl: customRpcUrl }
        : selectedNetwork;

      await onConnect(privateKey, networkToUse);
    } catch (error) {
      console.error('连接失败:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setPrivateKey('');
    setCustomRpcUrl('');
  };

  const handleSwitchNetwork = async (network: NetworkConfig) => {
    try {
      await onSwitchNetwork(network);
      setShowNetworkSelector(false);
    } catch (error) {
      console.error('网络切换失败:', error);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wifi className="text-green-400" size={20} />
            <h3 className="text-lg font-semibold text-white">已连接</h3>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            断开连接
          </button>
        </div>
        
        {currentNetwork && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentNetwork.color }}
                />
                <span className="text-white font-medium">{currentNetwork.name}</span>
              </div>
              <button
                onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors flex items-center space-x-1"
              >
                <Settings size={12} />
                <span>切换</span>
              </button>
            </div>

            {showNetworkSelector && (
              <div className="bg-gray-700 rounded-md p-3 space-y-2">
                <p className="text-xs text-gray-400 mb-2">选择网络:</p>
                {NETWORKS.map((network) => (
                  <button
                    key={network.chainId}
                    onClick={() => handleSwitchNetwork(network)}
                    className={`w-full flex items-center space-x-2 px-2 py-1 text-left rounded text-sm transition-colors ${
                      currentNetwork.chainId === network.chainId
                        ? 'bg-gray-600 text-white'
                        : 'hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: network.color }}
                    />
                    <span>{network.name}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-400">
              链 ID: {currentNetwork.chainId} • {currentNetwork.symbol}
            </p>
            <p className="text-xs text-gray-500 truncate">
              RPC: {currentNetwork.rpcUrl}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <WifiOff className="text-gray-400" size={20} />
        <h3 className="text-lg font-semibold text-white">连接钱包</h3>
      </div>
      
      <div className="space-y-4">
        <PrivateKeyInput
          value={privateKey}
          onChange={setPrivateKey}
          disabled={isConnecting}
        />
        
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
          disabled={isConnecting}
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            自定义 RPC URL（可选）
          </label>
          <input
            type="url"
            value={customRpcUrl}
            onChange={(e) => setCustomRpcUrl(e.target.value)}
            disabled={isConnecting}
            placeholder="https://your-custom-rpc-url.com"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        
        <button
          onClick={handleConnect}
          disabled={!privateKey || !selectedNetwork || !isValidPrivateKey(privateKey) || isConnecting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Wallet size={18} />
          <span>{isConnecting ? '连接中...' : '连接'}</span>
        </button>
      </div>
    </div>
  );
};
import React, { useState } from "react";
import { NetworkConfig } from "../types/web3";
import { NETWORKS } from "../utils/networks";
import { ChevronDown } from "lucide-react";

interface NetworkSelectorProps {
  selectedNetwork: NetworkConfig | null;
  onNetworkChange: (network: NetworkConfig) => void;
  disabled?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const NetworkIcon: React.FC<{ network: NetworkConfig; size?: number }> = ({
    network,
    size = 16
  }) => {
    if (network.iconUrl) {
      return (
        <img
          src={network.iconUrl}
          alt={network.name}
          className="rounded-full flex-shrink-0"
          style={{ width: size, height: size }}
          onError={(e) => {
            // 如果图标加载失败，显示颜色圆点作为后备
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
      );
    }
    return (
      <div
        className="rounded-full flex-shrink-0"
        style={{
          backgroundColor: network.color,
          width: size,
          height: size
        }}
      />
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">网络</label>

      {/* 自定义下拉菜单 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 flex items-center justify-between"
        >
          {selectedNetwork ? (
            <div className="flex items-center space-x-2">
              <NetworkIcon network={selectedNetwork} />
              <span>{selectedNetwork.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">选择网络</span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* 下拉选项 */}
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {NETWORKS.map((network) => (
              <button
                key={network.chainId}
                type="button"
                onClick={() => {
                  onNetworkChange(network);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex items-center space-x-2"
              >
                <NetworkIcon network={network} />
                <div className="flex-1">
                  <div className="text-white">{network.name}</div>
                  <div className="text-xs text-gray-400">
                    {network.symbol} • 链 ID: {network.chainId}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 网络信息显示 */}
      {selectedNetwork && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <NetworkIcon network={selectedNetwork} size={14} />
          <span>{selectedNetwork.symbol}</span>
          <span>•</span>
          <span>链 ID: {selectedNetwork.chainId}</span>
          <span>•</span>
          <span className="capitalize">{selectedNetwork.type}</span>
        </div>
      )}
    </div>
  );
};

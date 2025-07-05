import React from "react";
import { NetworkConfig } from "../types/web3";
import { NETWORKS } from "../utils/networks";

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
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">网络</label>
      <select
        value={selectedNetwork?.chainId || ""}
        onChange={(e) => {
          const network = NETWORKS.find(
            (n) => n.chainId === Number(e.target.value)
          );
          if (network) onNetworkChange(network);
        }}
        disabled={disabled}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      >
        <option value="">选择网络</option>
        {NETWORKS.map((network) => (
          <option key={network.chainId} value={network.chainId}>
            {network.name}
          </option>
        ))}
      </select>
      {selectedNetwork && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedNetwork.color }}
          />
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

import React, { useState, useEffect, useCallback } from "react";
import { Wallet, RefreshCw, Copy, ExternalLink } from "lucide-react";
import { ethers } from "ethers";
import { shortenAddress } from "../utils/crypto";
import { NetworkConfig } from "../types/web3";

interface WalletPanelProps {
  wallet: ethers.Wallet | null;
  onGetBalance: (address: string) => Promise<string>;
  currentNetwork: NetworkConfig | null;
  isConnected: boolean;
}

export const WalletPanel: React.FC<WalletPanelProps> = ({
  wallet,
  onGetBalance,
  currentNetwork,
  isConnected,
}) => {
  const [balance, setBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadBalance = useCallback(async () => {
    if (!wallet || !isConnected) return;

    setIsLoadingBalance(true);
    try {
      const bal = await onGetBalance(wallet.address);
      setBalance(bal);
    } catch (error) {
      console.error("获取余额失败:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet, isConnected, onGetBalance]);

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [wallet, isConnected, onGetBalance, loadBalance]);

  if (!wallet || !isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Wallet className="text-gray-400" size={20} />
          <h3 className="text-lg font-semibold text-white">钱包信息</h3>
        </div>
        <p className="text-gray-400 text-center py-8">连接钱包以查看详细信息</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Wallet className="text-green-400" size={20} />
        <h3 className="text-lg font-semibold text-white">钱包信息</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            地址
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm">
              {shortenAddress(wallet.address)}
            </code>
            <button
              onClick={copyAddress}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              {copied ? "✓" : <Copy size={16} />}
            </button>
            {currentNetwork && (
              <a
                href={`${currentNetwork.blockExplorer}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-300">
              余额
            </label>
            <button
              onClick={loadBalance}
              disabled={isLoadingBalance}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isLoadingBalance ? "animate-spin" : ""}
              />
            </button>
          </div>
          <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
            <span className="text-white font-mono text-lg">
              {balance} {currentNetwork?.symbol || "ETH"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

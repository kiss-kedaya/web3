import React, { useState } from "react";
import {
  Key,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Shuffle,
  Plus,
} from "lucide-react";
import * as bip39 from "bip39";
import { NetworkConfig } from "../types/web3";
import { generateWalletFromMnemonic } from "../utils/crypto";
import { getDefaultNetwork } from "../utils/networks";
import { NetworkSelector } from "./NetworkSelector";

interface MnemonicPanelProps {
  onConnectWallet: (
    privateKey: string,
    network: NetworkConfig
  ) => Promise<void>;
  currentNetwork: NetworkConfig | null;
}

interface GeneratedWallet {
  index: number;
  address: string;
  privateKey: string;
  path: string;
  type: "evm";
}

export const MnemonicPanel: React.FC<MnemonicPanelProps> = ({
  onConnectWallet,
  currentNetwork,
}) => {
  const [mnemonic, setMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [walletCount, setWalletCount] = useState(5);
  const [generatedWallets, setGeneratedWallets] = useState<GeneratedWallet[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(
    currentNetwork || getDefaultNetwork()
  );

  // 生成新的助记词
  const generateMnemonic = () => {
    const newMnemonic = bip39.generateMnemonic();
    setMnemonic(newMnemonic);
    setGeneratedWallets([]);
  };

  // 验证助记词
  const validateMnemonic = (mnemonic: string): boolean => {
    return bip39.validateMnemonic(mnemonic);
  };

  // 从助记词生成钱包
  const generateWalletsFromMnemonic = async () => {
    if (!mnemonic || !validateMnemonic(mnemonic)) {
      alert("请输入有效的助记词");
      return;
    }

    setIsGenerating(true);
    try {
      const wallets: GeneratedWallet[] = [];

      for (let i = 0; i < walletCount; i++) {
        const walletData = generateWalletFromMnemonic(mnemonic, i);

        wallets.push({
          index: i,
          address: walletData.address,
          privateKey: walletData.privateKey,
          path: walletData.path,
          type: "evm",
        });
      }

      setGeneratedWallets(wallets);
    } catch (error) {
      console.error("生成钱包失败:", error);
      alert(
        `生成钱包失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出钱包到 TXT 文件
  const exportWallets = () => {
    if (generatedWallets.length === 0) {
      alert("没有可导出的钱包");
      return;
    }

    const content = generatedWallets
      .map((wallet) => `${wallet.address}----${wallet.privateKey}`)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evm_wallets_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 连接指定钱包
  const connectWallet = async (privateKey: string) => {
    if (!selectedNetwork) {
      alert("请先选择网络");
      return;
    }

    try {
      await onConnectWallet(privateKey, selectedNetwork);
    } catch (error) {
      console.error("连接钱包失败:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 助记词生成和输入 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Key className="text-green-400" size={20} />
          <h3 className="text-lg font-semibold text-white">助记词管理</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              助记词（12个单词）
            </label>
            <div className="relative">
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="输入现有助记词或点击生成新的助记词..."
                rows={3}
                className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:border-transparent ${
                  showMnemonic ? "font-mono" : "font-mono text-transparent"
                } ${
                  mnemonic && !validateMnemonic(mnemonic)
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-600 focus:ring-green-500"
                }`}
                style={
                  showMnemonic
                    ? {}
                    : { textShadow: "0 0 8px rgba(255,255,255,0.8)" }
                }
              />
              <button
                type="button"
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showMnemonic ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mnemonic && !validateMnemonic(mnemonic) && (
              <p className="text-sm text-red-400">无效的助记词格式</p>
            )}
            {mnemonic && validateMnemonic(mnemonic) && (
              <p className="text-sm text-green-400">助记词格式正确</p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={generateMnemonic}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Shuffle size={18} />
              <span>生成新助记词</span>
            </button>
          </div>
        </div>
      </div>

      {/* 钱包生成设置 */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-white">助记词生成钱包</h3>
        </div>

        <div className="space-y-4">
          <NetworkSelector
            selectedNetwork={selectedNetwork}
            onNetworkChange={setSelectedNetwork}
            disabled={isGenerating}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              生成钱包数量
            </label>
            <input
              type="number"
              value={walletCount}
              onChange={(e) =>
                setWalletCount(
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                )
              }
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500">最多可生成 100 个钱包</p>
          </div>

          <button
            onClick={generateWalletsFromMnemonic}
            disabled={!mnemonic || !validateMnemonic(mnemonic) || isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RefreshCw
              size={18}
              className={isGenerating ? "animate-spin" : ""}
            />
            <span>{isGenerating ? "生成中..." : "生成 EVM 钱包"}</span>
          </button>
        </div>
      </div>

      {/* 生成的钱包列表 */}
      {generatedWallets.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              生成的钱包 (EVM)
            </h3>
            <button
              onClick={exportWallets}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Download size={18} />
              <span>导出 TXT</span>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {generatedWallets.map((wallet) => (
              <div
                key={wallet.index}
                className="bg-gray-700 rounded-md p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    钱包 #{wallet.index + 1} (ETH)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => connectWallet(wallet.privateKey)}
                      disabled={
                        !selectedNetwork || selectedNetwork.type !== "evm"
                      }
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      连接
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-gray-400">地址:</span>
                    <p className="text-sm font-mono text-white break-all">
                      {wallet.address}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">私钥:</span>
                    <p className="text-sm font-mono text-white break-all">
                      {wallet.privateKey}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400">路径:</span>
                    <p className="text-sm font-mono text-gray-300">
                      {wallet.path}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <p className="text-sm text-gray-300">
              <strong>导出格式:</strong> 地址----私钥（每行一个钱包）
            </p>
            <p className="text-xs text-gray-500 mt-1">
              生成了 {generatedWallets.length} 个 EVM 钱包，点击"导出
              TXT"保存到文件
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

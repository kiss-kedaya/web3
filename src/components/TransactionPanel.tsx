import React, { useState } from "react";
import { Send, Calculator } from "lucide-react";
import { Transaction } from "../types/web3";
import { isValidAddress } from "../utils/crypto";

interface TransactionPanelProps {
  onSendTransaction: (transaction: Transaction) => Promise<void>;
  onEstimateGas: (transaction: Transaction) => Promise<string>;
  gasPrice: string;
  isConnected: boolean;
}

export const TransactionPanel: React.FC<TransactionPanelProps> = ({
  onSendTransaction,
  onEstimateGas,
  gasPrice,
  isConnected,
}) => {
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [gasLimit, setGasLimit] = useState("21000");
  const [customGasPrice, setCustomGasPrice] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [gasEstimate, setGasEstimate] = useState("");

  const handleEstimateGas = async () => {
    if (!to || !isValidAddress(to)) return;

    try {
      const estimate = await onEstimateGas({ to, value, data });
      setGasEstimate(estimate);
      setGasLimit(estimate);
    } catch (error) {
      console.error("Gas 估算失败:", error);
    }
  };

  const handleSendTransaction = async () => {
    if (!to || !isValidAddress(to)) return;

    setIsSending(true);
    try {
      await onSendTransaction({
        to,
        value,
        data,
        gasLimit,
        gasPrice: customGasPrice || gasPrice,
      });

      // 重置表单
      setTo("");
      setValue("");
      setData("");
      setGasLimit("21000");
      setGasEstimate("");
    } catch (error) {
      console.error("交易失败:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Send className="text-blue-400" size={20} />
        <h3 className="text-lg font-semibold text-white">发送交易</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            接收地址
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {to && !isValidAddress(to) && (
            <p className="text-sm text-red-400">无效地址</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            金额 (ETH)
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            数据（可选）
          </label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Gas 限制
            </label>
            <input
              type="text"
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Gas 价格 (Gwei)
            </label>
            <input
              type="text"
              value={customGasPrice}
              onChange={(e) => setCustomGasPrice(e.target.value)}
              placeholder={gasPrice}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {gasEstimate && (
          <div className="bg-gray-700 rounded-md p-3">
            <p className="text-sm text-gray-300">
              估算 Gas:{" "}
              <span className="text-white font-mono">{gasEstimate}</span>
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleEstimateGas}
            disabled={!isConnected || !to || !isValidAddress(to)}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Calculator size={18} />
            <span>估算 Gas</span>
          </button>

          <button
            onClick={handleSendTransaction}
            disabled={!isConnected || !to || !isValidAddress(to) || isSending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Send size={18} />
            <span>{isSending ? "发送中..." : "发送"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

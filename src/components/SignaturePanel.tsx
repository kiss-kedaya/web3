import React, { useState } from "react";
import { FileSignature, Check, X } from "lucide-react";
import { ethers } from "ethers";

interface SignaturePanelProps {
  onSignMessage: (message: string) => Promise<string>;
  isConnected: boolean;
}

export const SignaturePanel: React.FC<SignaturePanelProps> = ({
  onSignMessage,
  isConnected,
}) => {
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  const [verifyAddress, setVerifyAddress] = useState("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );
  const [isSigning, setIsSigning] = useState(false);

  const handleSignMessage = async () => {
    if (!message.trim()) return;

    setIsSigning(true);
    try {
      const sig = await onSignMessage(message);
      setSignature(sig);
    } catch (error) {
      console.error("签名失败:", error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!verifyMessage || !verifySignature || !verifyAddress) return;

    try {
      const recoveredAddress = ethers.verifyMessage(
        verifyMessage,
        verifySignature
      );
      setVerificationResult(
        recoveredAddress.toLowerCase() === verifyAddress.toLowerCase()
      );
    } catch (error) {
      console.error("验证失败:", error);
      setVerificationResult(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <FileSignature className="text-purple-400" size={20} />
        <h3 className="text-lg font-semibold text-white">消息签名</h3>
      </div>

      <div className="space-y-6">
        {/* 签名消息 */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-300">签名消息</h4>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              消息
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入要签名的消息..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSignMessage}
            disabled={!isConnected || !message.trim() || isSigning}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigning ? "签名中..." : "签名消息"}
          </button>

          {signature && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                签名
              </label>
              <textarea
                value={signature}
                readOnly
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm font-mono"
              />
            </div>
          )}
        </div>

        {/* 验证签名 */}
        <div className="space-y-4 pt-4 border-t border-gray-700">
          <h4 className="text-md font-medium text-gray-300">验证签名</h4>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              原始消息
            </label>
            <textarea
              value={verifyMessage}
              onChange={(e) => setVerifyMessage(e.target.value)}
              placeholder="输入原始消息..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              签名
            </label>
            <textarea
              value={verifySignature}
              onChange={(e) => setVerifySignature(e.target.value)}
              placeholder="输入签名..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              预期地址
            </label>
            <input
              type="text"
              value={verifyAddress}
              onChange={(e) => setVerifyAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleVerifySignature}
            disabled={!verifyMessage || !verifySignature || !verifyAddress}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            验证签名
          </button>

          {verificationResult !== null && (
            <div
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                verificationResult
                  ? "bg-green-900 text-green-200"
                  : "bg-red-900 text-red-200"
              }`}
            >
              {verificationResult ? <Check size={16} /> : <X size={16} />}
              <span>
                {verificationResult ? "签名验证成功" : "签名验证失败"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

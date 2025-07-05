import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PrivateKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const PrivateKeyInput: React.FC<PrivateKeyInputProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        私钥
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="输入您的私钥 (0x...)"
          className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        您的私钥不会被存储或传输。请妥善保管。
      </p>
    </div>
  );
};
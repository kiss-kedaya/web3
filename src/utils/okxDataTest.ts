/**
 * OKX API数据解析测试工具
 * 用于验证修复后的数据解析是否正确处理OKX API返回的数据格式
 */

// 模拟OKX API返回的BSC交易数据
export const mockOKXBSCData = {
  "code": 0,
  "msg": "",
  "detailMsg": "",
  "data": {
    "total": 27,
    "hits": [
      {
        "hash": "0xc008f3821d21b9fda2fbe8caf59ff87e2f099097ef66989c177a177802c8409f",
        "blockHash": "0x6515ac1280be6017fe16c3d212a73268b216e18fb6c2b2fc4be012a72a9fb6e3",
        "blockHeight": 52791100,
        "blocktime": 1751591126,
        "method": "BNB transfer",
        "from": "0x66e4c18d180727736d0d061d1ed80259a3207a0e",
        "to": "0xabaea56d053edda1b24b84d0c6f569975736d970",
        "value": 0.063633635,
        "realValue": -0.063633635,
        "fee": 2.625E-6,
        "isError": false,
        "status": "0x1",
        "isFromContract": false,
        "isToContract": false,
        "fromTokenUrl": "",
        "toTokenUrl": "",
        "isFromRisk": false,
        "isToRisk": false
      },
      {
        "hash": "0xc13c0fc54fa1a38b40abc165b27ac57a4756571786efc41fd78100c2dd83e065",
        "blockHash": "0x02fffd800b374f3d8eb5fe5533fb8860b5e042578a47c66dc00e6f4f57522b47",
        "blockHeight": 52790839,
        "blocktime": 1751590930,
        "methodId": "0xa9059cbb",
        "method": "transfer",
        "from": "0x66e4c18d180727736d0d061d1ed80259a3207a0e",
        "to": "0x55d398326f99059ff775485246999027b3197955",
        "value": 0.0,
        "realValue": -0.0,
        "fee": 6.451875E-6,
        "isError": false,
        "status": "0x1",
        "isFromContract": false,
        "isToContract": true,
        "fromTokenUrl": "",
        "toTokenUrl": "https://static.oklink.com/cdn/web3/currency/token/small/137-0x1e4a5963abfd975d8c9021ce480b42188849d41d-1?v=1747041877373",
        "isFromRisk": false,
        "isToRisk": false
      },
      {
        "hash": "0x9c418e991ea5c375e44ba62fd8b4e16c078e927d7045b50b2aca564828d0253c",
        "blockHash": "0xdc5c5b6972939c3d480bace86b59ac87fef87a026e3c986a5c9e046458854b83",
        "blockHeight": 52790820,
        "blocktime": 1751590916,
        "method": "BNB transfer",
        "from": "0x326485121a05cd7bced0491385d0dfa604b98e6e",
        "to": "0x66e4c18d180727736d0d061d1ed80259a3207a0e",
        "value": 0.001930395,
        "realValue": 0.001930395,
        "fee": 2.625E-6,
        "isError": false,
        "status": "0x1",
        "isFromContract": false,
        "isToContract": false,
        "fromTokenUrl": "",
        "toTokenUrl": "",
        "isFromRisk": false,
        "isToRisk": false
      }
    ]
  }
};

/**
 * 测试数据解析函数
 */
export function testOKXDataParsing() {
  console.group('🧪 OKX数据解析测试');
  
  const testCases = [
    { name: '正常小数值', value: 0.063633635, expected: '0.063633635' },
    { name: '零值', value: 0.0, expected: '0' },
    { name: '科学计数法', value: 2.625E-6, expected: '0.000002625' },
    { name: '负值（支出）', value: -0.018, expected: '0.018' },
    { name: '大数值', value: 0.1137859, expected: '0.1137859' },
    { name: 'null值', value: null, expected: '0' },
    { name: 'undefined值', value: undefined, expected: '0' },
    { name: '字符串数值', value: '0.002', expected: '0.002' },
  ];

  testCases.forEach(testCase => {
    try {
      const result = parseOKXValue(testCase.value);
      const passed = result === testCase.expected;
      console.log(
        `${passed ? '✅' : '❌'} ${testCase.name}: ${testCase.value} → ${result} ${passed ? '' : `(期望: ${testCase.expected})`}`
      );
    } catch (error) {
      console.error(`❌ ${testCase.name}: 解析失败`, error);
    }
  });

  console.groupEnd();
}

/**
 * 解析OKX API的value字段（测试版本）
 */
function parseOKXValue(value: any): string {
  try {
    if (value === null || value === undefined) {
      return '0';
    }
    
    if (typeof value === 'number') {
      return Math.abs(value).toString();
    }
    
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return Math.abs(numValue).toString();
      }
    }
    
    return '0';
  } catch (error) {
    console.warn('解析OKX value失败:', error, 'value:', value);
    return '0';
  }
}

/**
 * 测试完整的交易数据解析
 */
export function testFullTransactionParsing() {
  console.group('🔍 完整交易数据解析测试');
  
  const sampleTx = mockOKXBSCData.data.hits[0];
  console.log('原始交易数据:', sampleTx);
  
  const parsedData = {
    hash: sampleTx.hash,
    blockNumber: parseInt(sampleTx.blockHeight.toString()),
    value: parseOKXValue(sampleTx.value),
    gasPrice: parseOKXGasPrice(sampleTx.fee),
    timestamp: sampleTx.blocktime,
    status: parseOKXStatus(sampleTx.status, sampleTx.isError),
    method: sampleTx.method
  };
  
  console.log('解析后数据:', parsedData);
  console.groupEnd();
}

function parseOKXGasPrice(fee: any): string {
  try {
    if (fee === null || fee === undefined) return '0';
    if (typeof fee === 'number') return (fee * 1e9).toFixed(2);
    if (typeof fee === 'string') {
      const numFee = parseFloat(fee);
      if (!isNaN(numFee)) return (numFee * 1e9).toFixed(2);
    }
    return '0';
  } catch (error) {
    return '0';
  }
}

function parseOKXStatus(status: any, isError: any): number {
  try {
    if (isError === true || isError === 'true') return 0;
    if (status === '0x1' || status === 1 || status === '1') return 1;
    if (status === '0x0' || status === 0 || status === '0') return 0;
    return 1;
  } catch (error) {
    return 1;
  }
}

// 在开发环境中自动运行测试
if (import.meta.env.DEV) {
  // 延迟执行，避免影响应用启动
  setTimeout(() => {
    testOKXDataParsing();
    testFullTransactionParsing();
  }, 2000);
}

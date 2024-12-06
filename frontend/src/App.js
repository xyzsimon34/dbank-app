import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import LoadingSpinner from './components/LoadingSpinner';
import DBank from './contracts/DBank.json';
import contractAddress from './contracts/contract-address.json';

const dBankAddress = contractAddress.DBank;
const dBankABI = DBank.abi;

function App() {
  // 狀態管理
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);

  // 初始化效果
  useEffect(() => {
    checkWalletConnection();
    setupEventListeners();
    return () => removeEventListeners();
  }, []);

  // 當帳戶改變時更新餘額
  useEffect(() => {
    if (isConnected && account && provider) {
      getBalance();
    }
  }, [isConnected, account, provider]);

  // MetaMask 事件監聽器
  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  // 檢查錢包連接狀態
  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        setProvider(provider);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('錢包連接檢查失敗:', error);
      }
    }
  };

  // 處理帳戶變更
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAccount('');
      showNotification('錢包已斷開連接', 'error');
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
      showNotification('帳戶已更改', 'success');
    }
  };

  // 處理鏈變更
  const handleChainChanged = () => {
    window.location.reload();
  };

  // 顯示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // 連接錢包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        setIsConnected(true);
        showNotification('錢包連接成功！');
      } catch (error) {
        showNotification('錢包連接失敗：' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      showNotification('請安裝 MetaMask！', 'error');
    }
  };

  // 獲取餘額
  const getBalance = async () => {
    if (!account || !provider) return;

    try {
      const signer = await provider.getSigner();
      const contract = new Contract(dBankAddress, dBankABI, signer);

      const balanceWei = await contract.getBalance();
      const balanceEth = formatEther(balanceWei);
      setBalance(balanceEth);
    } catch (error) {
      console.error('獲取餘額失敗:', error);
      showNotification('獲取餘額失敗', 'error');
    }
  };

  // 存款
  const deposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showNotification('請輸入有效的存款金額', 'error');
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(dBankAddress, dBankABI, signer);
      const amountInWei = parseEther(amount);

      const tx = await contract.deposit({
        value: amountInWei,
        gasLimit: 100000,
      });
      showNotification('交易已提交，等待確認...');

      await tx.wait();
      await getBalance();
      showNotification('存款成功！');
      setAmount('');
    } catch (error) {
      console.error('存款錯誤:', error);
      showNotification('存款失敗：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 提款
  const withdraw = async () => {
    if (!isConnected) {
      showNotification('請先連接錢包', 'error');
      return;
    }

    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(dBankAddress, dBankABI, signer);
      const tx = await contract.withdraw();

      showNotification('交易已提交，等待確認...');
      await tx.wait();
      await getBalance();
      showNotification('提款成功！');
    } catch (error) {
      console.error('提款失敗:', error);
      showNotification('提款失敗：' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      {notification.show && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white transition-all duration-500 ease-in-out z-50`}
        >
          {notification.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="glass-effect rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">DBank</h1>
              <p className="text-gray-500 mt-1">去中心化銀行系統</p>
            </div>
            <button
              onClick={connectWallet}
              disabled={loading}
              className={`px-4 py-2 ${
                isConnected
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-primary hover:bg-secondary'
              } text-white rounded-lg transition-colors duration-200 disabled:opacity-50`}
            >
              {loading ? (
                <LoadingSpinner />
              ) : isConnected ? (
                `${account.slice(0, 6)}...${account.slice(-4)}`
              ) : (
                '連接錢包'
              )}
            </button>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-inner">
            <p className="text-gray-500 mb-2">當前餘額</p>
            <p className="text-4xl font-bold text-gray-800 animate-pulse-slow">
              {balance} ETH
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-2xl shadow-xl p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">存款</h2>
              <div className="flex space-x-4">
                <input
                  type="number"
                  placeholder="輸入存款金額 (ETH)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading || !isConnected}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:bg-gray-100"
                  min="0"
                  step="0.01"
                />
                <button
                  onClick={deposit}
                  disabled={loading || !isConnected || !amount}
                  className={`px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors duration-200 disabled:opacity-50`}
                >
                  {loading ? <LoadingSpinner /> : '存款'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">提款</h2>
              <button
                onClick={withdraw}
                disabled={loading || !isConnected || balance <= 0}
                className="px-6 py-2 bg-primary hover:bg-secondary text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner /> : '提款'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

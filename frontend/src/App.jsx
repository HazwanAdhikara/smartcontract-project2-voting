import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import useContract from './hooks/useContract';

import ConnectWallet from './components/ConnectWallet';
import ReadData from './components/ReadData';
import WriteAction from './components/WriteAction';

function App() {
  const [account, setAccount] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const {
    candidates, quorum, timeRemaining, isFinalized, contractOwner, voterInfo, quorumDetails,
    loading, txMessage, error, setError, setTxMessage, handleFastForward, handleVote, handleFinalize
  } = useContract(account, isCorrectNetwork);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          setIsCorrectNetwork(network.chainId === 31337n || network.chainId === 1337n);
        } else {
          setAccount('');
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const autoSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }],
      });
      setIsCorrectNetwork(true);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69',
              chainName: 'Hardhat Localhost',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            }],
          });
          setIsCorrectNetwork(true);
        } catch (addError) {
          setError('Gagal inisialisasi network lokal.');
        }
      } else {
        setError('Gagal beralih jaringan.');
      }
    }
  };

  const connectWallet = async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask tidak terdeteksi.');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      const network = await provider.getNetwork();
      const isLocal = network.chainId === 31337n || network.chainId === 1337n;
      
      if (!isLocal) {
        await autoSwitchNetwork();
      } else {
        setIsCorrectNetwork(true);
      }
    } catch (err) {
      setError('Akses koneksi dompet ditolak.');
    }
  };

  // === FUNGSI LOGOUT / TOMBOL BACK OTOMATIS ===
  const handleBackToLanding = () => {
    setAccount(''); // Menghapus session wallet di state untuk kembali ke awal
  };

  return (
    <div className="dashboard-container">
      <ConnectWallet 
        account={account} 
        connectWallet={connectWallet} 
        isCorrectNetwork={isCorrectNetwork} 
        voterInfo={voterInfo}
        isAdmin={account.toLowerCase() === contractOwner}
      />

      {txMessage && <div className="alert-strip info">Status: {txMessage}</div>}
      {error && <div className="alert-strip error">Error: {error}</div>}

      {/* TAMPILAN HERO LANDING SEBELUM USER LOGIN */}
      {!account && (
        <div className="crypto-card" style={{ marginTop: '40px', textAlign: 'center', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.03)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--cyan-glow)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.15)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-glow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px var(--cyan-glow))' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', margin: '12px 0 0 0', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #ffffff 30%, #9c8da4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Bilik Pemilihan Ketua Umum
          </h1>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '620px', margin: '0 0 24px 0', lineHeight: '1.6', fontWeight: '500' }}>
            Selamat datang di dApp Pemilu Digital. Platform pemungutan suara terdesentralisasi yang aman, transparan, dan terenkripsi menggunakan teknologi Smart Contract Blockchain.
          </p>
          
          <button className="btn-premium" onClick={connectWallet} style={{ fontSize: '0.95rem', padding: '16px 36px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(217, 43, 107, 0.15)' }}>
            Connect Wallet
          </button>

          <div style={{ display: 'flex', gap: '40px', marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '32px', width: '100%', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--cyan-glow)', fontWeight: '700', fontSize: '1.1rem' }}>✓ Secure</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Anti-Double Voting</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff4181', fontWeight: '700', fontSize: '1.1rem' }}>✓ Encrypted</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Privasi Terjaga</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffe543', fontWeight: '700', fontSize: '1.1rem' }}>✓ Verifiable</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Audit On-Chain</div>
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN PROTEKSI JIKA NETWORKNYA SALAH */}
      {account && !isCorrectNetwork && (
        <div className="crypto-card" style={{ marginTop: '40px', textAlign: 'center', padding: '40px', borderColor: 'rgba(255, 65, 129, 0.3)', background: 'rgba(255, 65, 129, 0.02)' }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h3 style={{ margin: '12px 0 8px 0', fontWeight: '700' }}>Jaringan Tidak Cocok</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Dompet Anda terdeteksi menggunakan jaringan di luar simulator. Sila beralih ke node lokal untuk berpartisipasi.
          </p>
          <button className="btn-premium" onClick={autoSwitchNetwork}>
            Beralih ke Hardhat Localhost
          </button>
        </div>
      )}

      {/* DASHBOARD UTAMA SETELAH BERHASIL LOGIN */}
      {account && isCorrectNetwork && !error && (
        <>
          <ReadData 
            timeRemaining={timeRemaining} 
            quorum={quorum} 
            isFinalized={isFinalized} 
            quorumDetails={quorumDetails}
            isAdmin={account.toLowerCase() === contractOwner}
          />
          
          <WriteAction 
            candidates={candidates} 
            loading={loading} 
            isFinalized={isFinalized} 
            voterInfo={voterInfo}
            isAdmin={account.toLowerCase() === contractOwner}
            handleVote={handleVote} 
            handleFinalize={handleFinalize} 
            handleFastForward={handleFastForward}
            handleBack={handleBackToLanding}
          />
        </>
      )}
    </div>
  );
}

export default App;
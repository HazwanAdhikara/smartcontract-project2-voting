import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';

const FULL_ABI = [
  ...CONTRACT_ABI, 
  "function finalize() external", 
  "function owner() view returns (address)", 
  "function totalFungsionaris() view returns (uint256)",
  "function votedFungsionaris() view returns (uint256)",
  "function totalWargaHMIT() view returns (uint256)",
  "function votedWargaHMIT() view returns (uint256)",
  "function totalAngkatan2025() view returns (uint256)",
  "function votedAngkatan2025() view returns (uint256)",
  "event Voted(address indexed voter, uint256 indexed candidateId, uint256 weight, uint8 entity)"
];

export default function useContract(account, isCorrectNetwork) {
  const [candidates, setCandidates] = useState([]);
  const [quorum, setQuorum] = useState({ fungsionaris: false, warga: false, angkatan: false, all: false });
  const [timeRemaining, setTimeRemaining] = useState('0');
  const [isFinalized, setIsFinalized] = useState(false);
  const [contractOwner, setContractOwner] = useState('');
  const [voterInfo, setVoterInfo] = useState({ isRegistered: false, hasVoted: false, entity: 0 });
  
  const [quorumDetails, setQuorumDetails] = useState({
    totalFungsionaris: 0,
    votedFungsionaris: 0,
    totalWarga: 0,
    votedWarga: 0,
    totalAngkatan: 0,
    votedAngkatan: 0
  });

  const [loading, setLoading] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [error, setError] = useState('');

  // Fungsi ambil data dari Blockchain (Diubah ke JsonRpcProvider untuk bypass cache MetaMask)
  const fetchBlockchainData = useCallback(async () => {
    if (!account || !isCorrectNetwork) return;
    try {
      setError('');
      // MENEMBAK NODE LOKAL LANGSUNG SUPAYA DATA READ-ONLY SELALU REALTIME INSTAN
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, provider);

      const ownerAddress = await contract.owner();
      setContractOwner(ownerAddress.toLowerCase());

      const candidateData = await contract.getAllCandidates();
      setCandidates(candidateData);

      const [fReached, wReached, aReached, allReached] = await contract.getQuorumStatus();
      setQuorum({ fungsionaris: fReached, warga: wReached, angkatan: aReached, all: allReached });

      const remaining = await contract.getTimeRemaining();
      setTimeRemaining(remaining.toString());

      const finalizedStatus = await contract.isFinalized();
      setIsFinalized(finalizedStatus);

      const info = await contract.getVoterInfo(account);
      setVoterInfo({
        isRegistered: info.isRegistered,
        hasVoted: info.hasVoted,
        entity: Number(info.entity)
      });

      const tF = await contract.totalFungsionaris();
      const vF = await contract.votedFungsionaris();
      const tW = await contract.totalWargaHMIT();
      const vW = await contract.votedWargaHMIT();
      const tA = await contract.totalAngkatan2025();
      const vA = await contract.votedAngkatan2025();

      setQuorumDetails({
        totalFungsionaris: Number(tF),
        votedFungsionaris: Number(vF),
        totalWarga: Number(tW),
        votedWarga: Number(vW),
        totalAngkatan: Number(tA),
        votedAngkatan: Number(vA)
      });

    } catch (err) {
      console.error(err);
      setError('Sinkronisasi data on-chain terputus.');
    }
  }, [account, isCorrectNetwork]);

  // Handle Event Listener Blockchain
  useEffect(() => {
    if (account && isCorrectNetwork) {
      fetchBlockchainData();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, provider);
      
      contract.on("Voted", fetchBlockchainData);

      return () => {
        contract.removeAllListeners("Voted");
      };
    }
  }, [account, isCorrectNetwork, fetchBlockchainData]);

  // Handle Countdown Timer Mundur Otomatis Per Detik
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const currentSeconds = parseInt(prevTime, 10);
        if (isNaN(currentSeconds) || currentSeconds <= 0) {
          clearInterval(timer);
          return '0';
        }
        return (currentSeconds - 1).toString();
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fungsi Aksi Lompat Waktu (Fast Forward) dengan Efek Animasi Meluncur Ke Angka 0
  const handleFastForward = async () => {
    try {
      setLoading(true);
      setTxMessage('Mempercepat waktu blockchain 7 hari ke depan...');
      setError('');

      // 1. Eksekusi perintah manipulasi waktu ke node EVM Hardhat lokal
      const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      await localProvider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await localProvider.send("evm_mine", []);

      // 2. TRIGGER ANIMASI TICKING CEPAT KE ANGKA 0 DI UI FRONTEND
      const startSeconds = parseInt(timeRemaining, 10);
      if (!isNaN(startSeconds) && startSeconds > 0) {
        setTxMessage('Menghitung mundur waktu simulasi dengan cepat...');
        
        const animationDuration = 1200; // Durasi total gerak animasi (1.2 detik)
        const frameRateTime = 25;       // Update angka setiap 25 milidetik
        const totalSteps = animationDuration / frameRateTime;
        const decrementPerStep = Math.ceil(startSeconds / totalSteps);
        
        let temporaryTime = startSeconds;

        await new Promise((resolve) => {
          const animationInterval = setInterval(() => {
            temporaryTime -= decrementPerStep;
            
            if (temporaryTime <= 0) {
              temporaryTime = 0;
              clearInterval(animationInterval);
              resolve(); // Animasi selesai, lanjut ke baris berikutnya
            }
            
            setTimeRemaining(temporaryTime.toString());
          }, frameRateTime);
        });
      }

      setTxMessage('Waktu berhasil dilompati! Deadline sekarang sudah habis.');
      
      // 3. Ambil kondisi status terbaru pasca lompatan waktu dari Blockchain
      await fetchBlockchainData();
    } catch (err) {
      console.error(err);
      setError('Gagal mempercepat waktu. Pastikan npx hardhat node menyala.');
    } finally {
      setLoading(false);
      setTimeout(() => setTxMessage(''), 3000);
    }
  };

  // Fungsi Aksi Vote
  const handleVote = async (candidateId) => {
    try {
      setLoading(true);
      setTxMessage('Menunggu otorisasi signatures...');
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, signer);

      const tx = await contract.vote(candidateId);
      setTxMessage('Menunggu konfirmasi block baru...');
      await tx.wait();

      setTxMessage('Transaksi terekam secara permanen.');
      await fetchBlockchainData();
    } catch (err) {
      console.error(err);
      setError('Koneksi transaksi terputus.');
    } finally {
      setLoading(false);
      setTimeout(() => setTxMessage(''), 3000);
    }
  };

  // Fungsi Aksi Finalize
  const handleFinalize = async () => {
    try {
      setLoading(true);
      setTxMessage('Memproses otorisasi penutupan...');
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, signer);

      const tx = await contract.finalize();
      setTxMessage('Mengunci parameter pemilihan...');
      await tx.wait();

      setTxMessage('Siklus pemilihan resmi ditutup.');
      await fetchBlockchainData();
    } catch (err) {
      console.error(err);
      setError('Gagal finalisasi: Syarat kuorum 30% per entitas belum terpenuhi atau waktu belum habis.');
    } finally {
      setLoading(false);
      setTimeout(() => setTxMessage(''), 4000);
    }
  };

  return {
    candidates, quorum, timeRemaining, isFinalized, contractOwner, voterInfo, quorumDetails,
    loading, txMessage, error, setError, setTxMessage, handleFastForward, handleVote, handleFinalize
  };
}
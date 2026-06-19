# VotingARA - Smart Contract (Blockchain Project #2)

## Deskripsi

Project VotingARA adalah smart contract voting on-chain untuk pemilihan Project Officer ARA 8.0 dengan sistem weighted voting, quorum 30% per entitas, deadline voting, dan finalisasi hasil.

## Anggota Kelompok

- Hazwan Adhikara Nasution (5027231017)
- Hafiz Akmaldi Santosa (5027221061)
- Malvin Putra Rismahardian (5027231048)

## Fitur Wajib 

| Fitur | Keterangan |
| ----- | ---------- |
| Owner membuat kandidat | Owner dapat menambahkan kandidat selama voting aktif |
| Voting satu kali per voter | Setiap voter hanya dapat memilih sekali, error `AlreadyVoted` jika mencoba ulang |
| Menampilkan hasil voting | `getWinner()`, `getAllCandidates()`, `getTotalWeightedVotes()` |
| Event saat vote | Event `Voted(voter, candidateId, weight, entity)` dikirim tiap vote |

## Fitur Bonus 

| Fitur | Keterangan |
| ----- | ---------- |
| **Deadline voting** | Owner set durasi via `setDeadline(seconds)`, voting otomatis berakhir |
| **Minimum quorum** | Quorum 30% dari tiap entitas harus terpenuhi sebelum finalisasi |
| **Weighted voting** | FUNGSIONARIS = bobot 3, WARGA_HMIT = bobot 2, ANGKATAN_2025 = bobot 1 |
| **Batch register** | Owner bisa daftarkan banyak voter sekaligus via `registerVotersBatch()` |
| **Custom errors** | Gas-efficient custom errors (Solidity 0.8.20+) |
| **NatSpec comments** | Seluruh fungsi terdokumentasi dengan NatSpec |

## Arsitektur Contract

```
VotingARA_dApp
├── Blockchain (Smart Contract)
│   ├── Enums
│   │   └── EntityType          → FUNGSIONARIS | WARGA_HMIT | ANGKATAN_2025
│   ├── Structs
│   │   ├── Candidate           → id, name, division, voteWeight, voteCount
│   │   └── Voter               → isRegistered, hasVoted, entity, votedCandidateId
│   ├── Constants
│   │   ├── WEIGHT_FUNGSIONARIS  = 3
│   │   ├── WEIGHT_WARGA_HMIT    = 2
│   │   ├── WEIGHT_ANGKATAN_2025 = 1
│   │   └── QUORUM_THRESHOLD     = 30 (%)
│   ├── Modifiers
│   │   ├── onlyOwner
│   │   ├── votingActive
│   │   ├── votingEnded
│   │   └── onlyRegisteredVoter
│   └── Events
│       ├── CandidateAdded(candidateId, name, division)
│       ├── VoterRegistered(voter, entity)
│       ├── Voted(voter, candidateId, weight, entity)
│       ├── VotingFinalized(winnerId, winnerName, totalWeightedVotes)
│       └── DeadlineSet(deadline)
└── Frontend (React Application)
├── Global States (App.jsx)
│   └── States              → account | isCorrectNetwork | txMessage | error
├── Components (src/components)
│   ├── ConnectWallet.jsx   → account | connectWallet | isCorrectNetwork | voterInfo | isAdmin
│   ├── ReadData.jsx        → timeRemaining | quorum | isFinalized | quorumDetails | isAdmin
│   ├── WriteAction.jsx     → candidates | loading | isFinalized | voterInfo | isAdmin | handleVote | handleFinalize | handleFastForward | handleBack
│   └── QuorumBar.jsx       → label | currentVotes | totalRegistered | isComplete | showDetails
├── Web3 Hook (src/hooks)
│   └── useContract.js      → fetchBlockchainData() | handleVote() | handleFinalize() | handleFastForward()
└── Utilities (src/utils)
├── contract.js         → CONTRACT_ADDRESS | CONTRACT_ABI
└── helpers.js          → shortenAddress() | getEntityName() | formatSeconds()
```

## Mekanisme Voting

1. **Setup** — Owner set deadline, tambah kandidat, dan daftarkan voter ke entitas masing-masing.
2. **Voting** — Voter terdaftar memanggil `vote(candidateId)`. Bobot suara dihitung otomatis berdasarkan entitas.
3. **Quorum Check** — Minimal 30% dari tiap entitas harus sudah vote.
4. **Finalisasi** — Setelah deadline lewat dan quorum terpenuhi, owner panggil `finalize()` untuk mengunci pemenang.
5. **Hasil** — Pemenang dilihat via `getWinner()`.

```
Contoh perhitungan bobot:
  2 FUNGSIONARIS vote kandidat A → +6 weighted votes
  3 WARGA_HMIT   vote kandidat B → +6 weighted votes
  5 ANGKATAN_2025 vote kandidat A → +5 weighted votes
  ────────────────────────────────────────────────────
  Kandidat A: 11 weighted votes  ← MENANG
  Kandidat B:  6 weighted votes
```

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm atau pnpm
- MetaMask

### Installation

```bash
npm install
```

### Compile

```bash
npm run compile
```

### Test

```bash
npm test
```

### Deploy (Local)

**Terminal 1** — Jalankan local node:
```bash
npx hardhat node
```

**Terminal 2** — Deploy contract (otomatis setup deadline + kandidat + 15 voter):
```bash
npm run deploy:localhost
```

Lalu ambil contract address dari output deploy, kemudian jalankan console:

```bash
npx hardhat console --network localhost
```

Lanjutkan langkah voting sesuai `logictest.md`.

### Interact (Opsional)

```bash
npm run interact:localhost
```

## Contract Address

Setelah deploy ke localhost, address muncul di output terminal:

```
VotingARA deployed by 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

> ⚠️ Address di atas adalah contoh — jalankan `npm run deploy:localhost` untuk mendapatkan address aktual.

## Koneksi MetaMask ke Hardhat Local

1. Install MetaMask dari Chrome Web Store
2. Buka MetaMask → network dropdown → **Add a custom network**
3. Isi data network:
   - **Network name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
4. Klik **Save**
5. Import akun: MetaMask → avatar kanan atas → **Import account** → masukkan private key dari output `npx hardhat node`
6. Berhasil jika saldo muncul `10000 ETH` di network **Hardhat Local**

## Screenshot

### Compile Berhasil

<img src="./img/compile success.png" alt="Compile berhasil">

### Hardhat Node Berjalan

<img src="./img/hardhat nodes.png" alt="Hardhat local node berjalan">

### Test Passing (19/19)

<img src="./img/test passing.png" alt="19 test cases passing">

### Deploy Berhasil

<img src="./img/deploy success.png" alt="Deploy berhasil, contract address tampil">

### MetaMask Connected (Hardhat Local)

<img src="./img/metamask.png" alt="MetaMask terhubung ke Hardhat Local dengan saldo 10000 ETH">

### Transaksi Berhasil

<img src="./img/transaksi.png" alt="Transaksi vote berhasil di MetaMask">

### State Berubah (Setelah Vote)

**Sebelum Voting**
<img src="./img/state awal.png" alt="Data kandidat sebelum voting">

**Sesudah Voting**
<img src="./img/state akhir.png" alt="Data kandidat berubah setelah voting">

## Referensi

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)


---

# Project 3 - Frontend & Web3 Integration

## Deskripsi Integrasi
Bagian ini merupakan dokumentasi kelanjutan untuk Project 3. Smart contract VotingARA yang sebelumnya berjalan pada lingkungan console/terminal kini telah diintegrasikan secara penuh ke dalam antarmuka aplikasi web berbasis React. Fokus utama pada pengembangan Project 3 ini meliputi manajemen state sinkronisasi blockchain, manajemen otorisasi wallet MetaMask, pelacakan kuorum per entitas secara real-time, serta penanganan feedback transaksi on-chain.

## Tech Stack Frontend
- Framework: React (Vite)
- Web3 Library: ethers.js (v6)
- Provider Jaringan: MetaMask Extension

## Fitur Aplikasi Web
- **Connect Wallet Session**: Autentikasi dan pembacaan address serta tipe elemen voter secara dinamis.
- **Live Quorum Tracking**: Bar persentase partisipasi pemilih dinamis yang memisahkan data tiap entitas.
- **Bilik Suara Terenkripsi**: Menyembunyikan jumlah akumulasi suara masuk sebelum pemilu resmi difinalisasi, kecuali diakses oleh akun Admin/Owner.
- **Real-time Event Listener**: Otomatis memperbarui data tampilan layar tanpa perlu refresh browser ketika blockchain memicu event `Voted`.
- **Simulasi Time Travel**: Modul akselerasi waktu EVM sebesar 7 hari ke depan dengan efek animasi hitung mundur cepat untuk pengujian deadline.

---

## Penjelasan Potongan Kode Komponen Utama

### 1. Custom Hook Web3 Integration (`useContract.js`)
Seluruh logika ethers.js dipisahkan dari komponen visual dan diisolasi ke dalam sebuah custom hook untuk menjaga arsitektur kode tetap bersih dan modular. Hook ini menggunakan `ethers.BrowserProvider` untuk berinteraksi dengan MetaMask.

```javascript
// Potongan logika pembacaan data on-chain secara kolektif
const fetchBlockchainData = useCallback(async () => {
  if (!account || !isCorrectNetwork) return;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, FULL_ABI, provider);

    // Membaca status kuorum 30% per entitas langsung dari smart contract
    const [fReached, wReached, aReached, allReached] = await contract.getQuorumStatus();
    setQuorum({ fungsionaris: fReached, warga: wReached, angkatan: aReached, all: allReached });

    // Membaca sisa detik deadline voting
    const remaining = await contract.getTimeRemaining();
    setTimeRemaining(remaining.toString());

    // Membaca info pendaftaran dan status hak suara milik user
    const info = await contract.getVoterInfo(account);
    setVoterInfo({
      isRegistered: info.isRegistered,
      hasVoted: info.hasVoted,
      entity: Number(info.entity)
    });
  } catch (err) {
    console.error(err);
  }
}, [account, isCorrectNetwork]);

```

### 2. Otorisasi dan Pemetaan Elemen (`ConnectWallet.jsx`)

Komponen ini menangani pemetaan representasi data biner `uint8 entity` dari smart contract menjadi identitas nama peran fungsionaris organisasi yang ramah pengguna.

```javascript
export default function ConnectWallet({ account, connectWallet, isCorrectNetwork, voterInfo, isAdmin }) {
  // Menerjemahkan index ID entitas tipe data enum dari Solidity
  const parseEntity = (id) => {
    if (id === 0) return "Fungsionaris (Weight 3)";
    if (id === 1) return "Warga HMIT (Weight 2)";
    return "Angkatan 2025 (Weight 1)";
  };

  // Memotong tampilan address hex panjang demi estetika UI navbar
  const sliceAddress = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : '';
  
  // Render UI menampilkan alamat ringkas dan tipe entitas pemilih terdaftar
}

```

### 3. Komponen Penghitung Kuorum (`QuorumBar.jsx`)

Komponen ini bertugas melakukan kalkulasi rasio partisipasi pemilih secara dinamis serta mengendalikan perubahan warna bar kemajuan visual dApp.

```javascript
export default function QuorumBar({ label, currentVotes, totalRegistered, isComplete, showDetails }) {
  // Rumus pengaman kalkulasi persentase dari pembagian dengan nilai nol (0)
  const percentage = totalRegistered === 0 ? 100 : Math.min(Math.round((currentVotes / totalRegistered) * 100), 100);
  
  // Kebijakan enkripsi: Status kelulusan kuorum hanya boleh ditampilkan jika voting selesai atau diakses admin
  const displayComplete = isComplete && showDetails;

  return (
    <div className="bar-track">
      <div 
        className={`bar-fill ${displayComplete ? 'complete' : 'incomplete'}`} 
        style={{ width: showDetails ? `${percentage}%` : '0%' }}
      ></div>
    </div>
  );
}

```

### 4. Format Waktu Hitung Mundur (`ReadData.jsx`)

Mengolah representasi data detik mentah berformat string (`secStr`) dari property blockchain menjadi teks penunjuk sisa waktu format jam digital terstandar.

```javascript
const renderCountdown = (secStr) => {
  const totalSec = parseInt(secStr, 10);
  if (isNaN(totalSec) || totalSec <= 0) return "Terminated";
  
  const days = Math.floor(totalSec / (24 * 3600));
  const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

```

### 5. Pengendali Panel Transaksi (`WriteAction.jsx`)

Komponen pengelola transaksi penulisan perubahan state blockchain (*write methods*). Komponen ini menonaktifkan tombol secara otomatis berdasarkan status pemilih dan siklus waktu kontrak agar menghemat penggunaan gas fee akibat penolakan transaksi (*reversion*).

```javascript
<button 
  className="btn-premium" 
  style={{ width: '100%' }}
  disabled={loading || isFinalized || voterInfo.hasVoted || !voterInfo.isRegistered}
  onClick={() => handleVote(cid)}
>
  {!voterInfo.isRegistered 
    ? "Sesi Viewer (Bukan Pemilih)" 
    : voterInfo.hasVoted 
      ? "Suara Anda Terkunci ✓" 
      : isFinalized 
        ? "Voting Selesai" 
        : "Berikan Suara"}
</button>

```

---

## Cara Menjalankan

### 1. Instalasi Folder Frontend

Buka terminal baru di luar repositori kontrak, masuk ke dalam folder frontend, lalu jalankan instalasi package dependencies:

```bash
cd frontend
npm install

```

### 2. Konfigurasi Alamat Kontrak Baru

Buka file `frontend/src/utils/contract.js`, lalu sesuaikan variabel `CONTRACT_ADDRESS` dengan alamat kontrak terbaru hasil keluaran terminal deploy Project 2 Anda:

```javascript
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

```

### 3. Menjalankan Server Lokal Frontend

Jalankan server pengembangan berbasis Vite lokal melalui perintah:

```bash
npm run dev

```

Setelah server aktif, buka browser Anda dan akses tautan url berikut:
`http://localhost:5173`

---

## Dokumentasi Tampilan Integrasi Web3

### 1. Dashboard Utama

Menampilkan visualisasi sisa waktu countdown pemilu, bilik suara digital kandidat, serta grafik pemenuhan batas kuorum 30% per entitas pemilih.
<img width="1411" height="744" alt="image" src="https://github.com/user-attachments/assets/7aa11058-b7dc-4c11-8b3f-81b5c7c1e476" />



### 2. Status Finalized

Tampilan interface penentuan pemenang on-chain ketika Admin/Owner sukses mengeksekusi metode fungsi `.finalize()` setelah kriteria pemilu terpenuhi.
<img width="1450" height="939" alt="image" src="https://github.com/user-attachments/assets/6c40e478-7b2b-4e70-a834-1f50a798a99c" />


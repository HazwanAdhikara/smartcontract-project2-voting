# VotingARA - Smart Contract (Blockchain Project #2)

## Deskripsi

Project VotingARA adalah smart contract voting on-chain untuk pemilihan Project Officer ARA 8.0 dengan sistem weighted voting, quorum 30% per entitas, deadline voting, dan finalisasi hasil.

## Anggota Kelompok

- Hazwan Adhikara Nasution (5027231017)
- Khapes

## Fitur

- Weighted voting untuk 3 entitas voter: FUNGSIONARIS, WARGA_HMIT, dan ANGKATAN_2025
- Quorum minimal 30% per entitas
- Deadline voting dan finalisasi hasil
- Register voter oleh owner dan voting satu kali per voter
- Menampilkan kandidat, pemenang, dan status quorum di console
- Custom error dan NatSpec comments pada contract

## Cara Menjalankan

### Prerequisites

- Node.js v18+
- npm atau pnpm

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

Terminal 1:

```bash
npx hardhat node
```

Terminal 2:

```bash
npm run deploy:localhost
```

Lalu ambil contract address dari output deploy, kemudian jalankan console:

```bash
npx hardhat console --network localhost
```

Setelah itu jalankan langkah-langkah voting sesuai `logictest.md` satu per satu.

## Contract Address

Cek di terminal 2 setelah di deploy,

ex: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## How to run and test?

- Step yang digunakan di project ini:
  1. `npm install`
  2. `npm run compile`
  3. `npm test`
  4. `npx hardhat node`
  5. Buka **MetaMask** bisa melalui extension Chrome untuk ngetest koneksi HardHat Local.
  6. Test koneksi MetaMask ke **Hardhat Local**:
     - Install MetaMask dari Chrome Web Store kalau belum punya
     - Buka MetaMask → network dropdown → **Add a custom network**
     - Isi data network:
       - Network name: `Hardhat Local`
       - RPC URL: `http://127.0.0.1:8545`
       - Chain ID: `31337`
       - Currency symbol: `ETH`
     - Klik **Save**
     - Buka MetaMask → avatar kanan atas → **Import account**
     - Import **`private key`** akun Hardhat #1:
     - Ulangi untuk akun #2 dan #3 kalau ingin demo dengan voter berbeda
     - Berhasil jika saldo muncul `10000 ETH` di network **Hardhat Local**
- Di terminal 2:
  1. `npm run deploy:localhost`
  2. ambil contract address
  3. `npx hardhat console --network localhost`
  4. Lanjutkan eksekusi voting satu per satu mengikuti `logictest.md`

## Screenshot

### MetaMask (HardHat Local)

<img src="./img/metamask.png">

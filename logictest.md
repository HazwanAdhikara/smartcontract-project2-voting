# Logic Test — Manual Console Testing Guide

Dokumen ini berisi langkah-langkah testing manual melalui Hardhat console setelah contract berhasil di-deploy.

## Prasyarat

Pastikan sudah menjalankan:
```bash
# Terminal 1
npx hardhat node

# Terminal 2
npm run deploy:localhost
# → Catat contract address dari output
```

Lalu buka Hardhat console:
```bash
npx hardhat console --network localhost
```

## Langkah-langkah Testing

> Jalankan setiap blok kode **satu per satu** di Hardhat console.

### Step 1 — Attach contract dan setup helper

```js
// 1. Attach contract (ganti address sesuai output deploy)
const contract = await ethers.getContractAt(
  "VotingARA",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
);

// 2. Define helper functions
const formatEntity = (entity) => {
  if (entity === 0n || entity === 0) return "FUNGSIONARIS";
  if (entity === 1n || entity === 1) return "WARGA_HMIT";
  return "ANGKATAN_2025";
};

const formatPercent = (value) => `${value.toFixed(1)}%`;

const showCandidates = async () => {
  const candidates = await contract.getAllCandidates();
  console.log("\n=== KANDIDAT ===");
  candidates.forEach((c, index) => {
    const weighted = Number(c.voteWeight);
    const voters = Number(c.voteCount);
    const avgWeight = voters > 0 ? (weighted / voters).toFixed(2) : "0.00";
    console.log(`[${index}] ${c.name} - ${c.division}`);
    console.log(`    weighted votes : ${weighted}`);
    console.log(`    voter count    : ${voters}`);
    console.log(`    avg weight/vote: ${avgWeight}`);
  });
};

const showWinner = async () => {
  console.log("\n=== PEMENANG ===");

  if (await contract.isFinalized()) {
    const winner = await contract.getWinner();
    const totalWeightedVotes = Number(await contract.getTotalWeightedVotes());
    console.log(`[${winner.id}] ${winner.name} - ${winner.division}`);
    console.log(`Weighted votes : ${winner.voteWeight}`);
    console.log(`Vote count      : ${winner.voteCount}`);
    console.log(`Total votes     : ${totalWeightedVotes}`);
    return;
  }

  const candidates = await contract.getAllCandidates();
  if (candidates.length === 0) {
    console.log("Belum ada kandidat.");
    return;
  }

  const provisionalWinner = candidates.reduce((best, current) =>
    current.voteWeight > best.voteWeight ? current : best,
  );

  console.log("Voting belum difinalisasi, ini pemenang sementara:");
  console.log(
    `[${provisionalWinner.id}] ${provisionalWinner.name} - ${provisionalWinner.division}`,
  );
  console.log(`Weighted votes : ${provisionalWinner.voteWeight}`);
  console.log(`Vote count      : ${provisionalWinner.voteCount}`);
};

const showTime = async () => {
  const secs = Number(await contract.getTimeRemaining());
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  console.log(`\n=== WAKTU TERSISA ===`);
  console.log(`${days} hari ${hours} jam ${mins} menit`);
};

const showQuorum = async () => {
  const q = await contract.getQuorumStatus();
  const totals = {
    fungsionaris: Number(await contract.totalFungsionaris()),
    warga: Number(await contract.totalWargaHMIT()),
    angkatan: Number(await contract.totalAngkatan2025()),
    votedFungsionaris: Number(await contract.votedFungsionaris()),
    votedWarga: Number(await contract.votedWargaHMIT()),
    votedAngkatan: Number(await contract.votedAngkatan2025()),
  };

  const fPct =
    totals.fungsionaris === 0
      ? 100
      : (totals.votedFungsionaris / totals.fungsionaris) * 100;
  const wPct =
    totals.warga === 0 ? 100 : (totals.votedWarga / totals.warga) * 100;
  const aPct =
    totals.angkatan === 0
      ? 100
      : (totals.votedAngkatan / totals.angkatan) * 100;

  console.log("\n=== QUORUM STATUS ===");
  console.log(
    `Fungsionaris : ${q[0] ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedFungsionaris
    }/${totals.fungsionaris} = ${formatPercent(fPct)})`,
  );
  console.log(
    `Warga HMIT   : ${q[1] ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedWarga
    }/${totals.warga} = ${formatPercent(wPct)})`,
  );
  console.log(
    `Angkatan 2025: ${q[2] ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedAngkatan
    }/${totals.angkatan} = ${formatPercent(aPct)})`,
  );
  console.log(
    `Semua        : ${q[3] ? "✅ Quorum terpenuhi" : "❌ Belum quorum"}`,
  );
};
```

### Step 2 — Ambil signers dan tampilkan state awal

```js
// Ambil semua signers (owner + 15 voter sesuai deploy.js)
const [
  owner,
  v1,  // FUNGSIONARIS
  v2,  // FUNGSIONARIS
  v3,  // WARGA_HMIT
  v4,  // WARGA_HMIT
  v5,  // WARGA_HMIT
  v6,  // ANGKATAN_2025
  v7,  // ANGKATAN_2025
  v8,  // ANGKATAN_2025
  v9,  // ANGKATAN_2025
  v10, // ANGKATAN_2025
  v11, // ANGKATAN_2025
  v12, // ANGKATAN_2025
  v13, // ANGKATAN_2025
  v14, // ANGKATAN_2025
  v15, // ANGKATAN_2025
] = await ethers.getSigners();

// Tampilkan state awal sebelum ada yang vote
await showCandidates();
await showTime();
await showQuorum();
```

### Step 3 — Mulai voting

```js
// FUNGSIONARIS (v1, v2) — bobot 3 per suara
await contract.connect(v1).vote(0n); // v1 pilih kandidat 0 (Rayy)
await contract.connect(v2).vote(1n); // v2 pilih kandidat 1 (Opung)

// WARGA_HMIT (v3, v4, v5) — bobot 2 per suara
await contract.connect(v3).vote(0n); // v3 pilih kandidat 0
await contract.connect(v4).vote(0n); // v4 pilih kandidat 0
await contract.connect(v5).vote(1n); // v5 pilih kandidat 1

// ANGKATAN_2025 (v6 s/d v15) — bobot 1 per suara
await contract.connect(v6).vote(0n);  // v6  pilih kandidat 0
await contract.connect(v7).vote(1n);  // v7  pilih kandidat 1
await contract.connect(v8).vote(0n);  // v8  pilih kandidat 0
await contract.connect(v9).vote(1n);  // v9  pilih kandidat 1
await contract.connect(v10).vote(0n); // v10 pilih kandidat 0
await contract.connect(v11).vote(1n); // v11 pilih kandidat 1
await contract.connect(v12).vote(0n); // v12 pilih kandidat 0
await contract.connect(v13).vote(1n); // v13 pilih kandidat 1
await contract.connect(v14).vote(0n); // v14 pilih kandidat 0
await contract.connect(v15).vote(1n); // v15 pilih kandidat 1
```

### Step 4 — Cek state setelah voting

```js
// Tampilkan state SETELAH semua vote
await showCandidates();
await showWinner(); // menampilkan pemenang sementara
await showQuorum();
```

**Ekspektasi hasil quorum** (semua voter vote = 100%):
```
Fungsionaris : ✅ Tercapai (2/2 = 100.0%)
Warga HMIT   : ✅ Tercapai (3/3 = 100.0%)
Angkatan 2025: ✅ Tercapai (10/10 = 100.0%)
Semua        : ✅ Quorum terpenuhi
```

**Ekspektasi weighted votes:**
```
Kandidat 0 (Rayy):
  v1(F,+3) + v3(W,+2) + v4(W,+2) + v6,v8,v10,v12,v14(A,+1 each)
  = 3 + 2 + 2 + 5 = 12 weighted votes

Kandidat 1 (Opung):
  v2(F,+3) + v5(W,+2) + v7,v9,v11,v13,v15(A,+1 each)
  = 3 + 2 + 5 = 10 weighted votes

→ Pemenang: Rayy (12 > 10)
```

### Step 5 — Finalisasi hasil

> Finalisasi hanya bisa dilakukan setelah **deadline habis** dan **quorum terpenuhi**.
> Karena deadline 7 hari di local node, gunakan `evm_increaseTime` untuk mempercepat waktu.

```js
// Percepat waktu melewati deadline (7 hari + 1 detik)
await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
await network.provider.send("evm_mine");

// Finalisasi oleh owner
await contract.connect(owner).finalize();

console.log("✅ Voting telah difinalisasi!");
```

### Step 6 — Tampilkan pemenang final

```js
// Setelah finalize(), getWinner() mengembalikan pemenang resmi
await showWinner();

// Cek status finalisasi
const finalized = await contract.isFinalized();
console.log(`\nStatus finalisasi: ${finalized ? "✅ Sudah difinalisasi" : "❌ Belum"}`);

// Tampilkan semua kandidat dengan hasil akhir
await showCandidates();
```

---

## Catatan Visual

- `weighted votes` — pengaruh suara sesuai bobot entitas (bukan sekedar jumlah orang).
- `voter count` — jumlah orang yang memilih kandidat itu.
- `avg weight/vote` — membantu membandingkan dampak bobot terhadap jumlah pemilih.
- Quorum menampilkan format `terpilih/total = persen` supaya terlihat jelas 30% itu berasal dari jumlah entitas terdaftar.
- `finalize()` mengunci hasil secara permanen — tidak bisa di-reset atau diulangi.

## Error yang Mungkin Muncul

| Error | Penyebab |
| ----- | -------- |
| `VotingNotActive` | Deadline belum di-set atau sudah habis |
| `AlreadyVoted` | Voter sudah pernah vote |
| `NotRegistered` | Address tidak terdaftar sebagai voter |
| `QuorumNotMet` | Belum 30% per entitas yang vote saat finalize |
| `VotingNotEnded` | Deadline belum habis dan belum difinalisasi |
| `AlreadyFinalized` | `finalize()` dipanggil dua kali |
| `NotOwner` | Fungsi owner dipanggil oleh non-owner |

```js
// 1. Attach contract
const contract = await ethers.getContractAt(
  "VotingARA",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3",
);

// 2. Define helpers
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

  console.log("Voting belum difinalisasi, jadi ini pemenang sementara:");
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

// 3. Ambil signers
const [
  owner,
  v1,
  v2,
  v3,
  v4,
  v5,
  v6,
  v7,
  v8,
  v9,
  v10,
  v11,
  v12,
  v13,
  v14,
  v15,
] = await ethers.getSigners();

// 4. Tunjukkan state awal sebelum ada yang vote
await showCandidates();
await showTime();
await showQuorum();

// 5. Mulai voting - tiap entitas berbeda
// FUNGSIONARIS (v1, v2) - weight 3
await contract.connect(v1).vote(0n); // v1 pilih kandidat 0
await contract.connect(v2).vote(1n); // v2 pilih kandidat 1

// WARGA_HMIT (v3, v4, v5) - weight 2
await contract.connect(v3).vote(0n); // v3 pilih kandidat 0
await contract.connect(v4).vote(0n); // v4 pilih kandidat 0
await contract.connect(v5).vote(1n); // v5 pilih kandidat 1

// ANGKATAN_2025 (v6 s/d v15) - weight 1
await contract.connect(v6).vote(0n); // v6 pilih kandidat 0
await contract.connect(v7).vote(1n); // v7 pilih kandidat 1
await contract.connect(v8).vote(0n); // v8 pilih kandidat 0
await contract.connect(v9).vote(1n); // v9 pilih kandidat 1
await contract.connect(v10).vote(0n); // v10 pilih kandidat 0
await contract.connect(v11).vote(1n); // v11 pilih kandidat 1
await contract.connect(v12).vote(0n); // v12 pilih kandidat 0
await contract.connect(v13).vote(1n); // v13 pilih kandidat 1
await contract.connect(v14).vote(0n); // v14 pilih kandidat 0
await contract.connect(v15).vote(1n); // v15 pilih kandidat 1

// 6. Tunjukkan state SETELAH semua vote
await showCandidates();
await showWinner();
await showQuorum();
```

### Catatan visual yang lebih jelas

- `weighted votes` menunjukkan pengaruh suara sesuai bobot entitas.
- `voter count` menunjukkan jumlah orang yang memilih kandidat itu.
- `avg weight/vote` membantu membandingkan dampak bobot terhadap jumlah pemilih.
- quorum menampilkan format `terpilih/total = persen` supaya terlihat jelas 30% itu berasal dari jumlah entitas terdaftar.

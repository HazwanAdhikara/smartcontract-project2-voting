const hre = require("hardhat");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

function formatEntity(entity) {
  if (entity === 0n || entity === 0) return "FUNGSIONARIS";
  if (entity === 1n || entity === 1) return "WARGA_HMIT";
  return "ANGKATAN_2025";
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

async function showCandidates(contract) {
  const candidates = await contract.getAllCandidates();
  console.log("\n=== KANDIDAT ===");

  candidates.forEach((candidate, index) => {
    const weighted = Number(candidate.voteWeight);
    const count = Number(candidate.voteCount);
    const avg = count > 0 ? (weighted / count).toFixed(2) : "0.00";

    console.log(`[${index}] ${candidate.name} - ${candidate.division}`);
    console.log(`    weighted votes : ${weighted}`);
    console.log(`    voter count    : ${count}`);
    console.log(`    avg weight/vote: ${avg}`);
  });
}

async function showWinner(contract) {
  console.log("\n=== PEMENANG ===");

  if (await contract.isFinalized()) {
    const winner = await contract.getWinner();
    const totalWeightedVotes = Number(await contract.getTotalWeightedVotes());

    console.log(`[${winner.id}] ${winner.name} - ${winner.division}`);
    console.log(`Weighted votes : ${winner.voteWeight}`);
    console.log(`Vote count     : ${winner.voteCount}`);
    console.log(`Total weighted : ${totalWeightedVotes}`);
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
  console.log(`Vote count     : ${provisionalWinner.voteCount}`);
}

async function showQuorum(contract) {
  const [fReached, wReached, aReached, allReached] =
    await contract.getQuorumStatus();
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
    `Fungsionaris : ${fReached ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedFungsionaris
    }/${totals.fungsionaris} = ${formatPercent(fPct)})`,
  );
  console.log(
    `Warga HMIT   : ${wReached ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedWarga
    }/${totals.warga} = ${formatPercent(wPct)})`,
  );
  console.log(
    `Angkatan 2025: ${aReached ? "✅ Tercapai" : "❌ Belum"} (${
      totals.votedAngkatan
    }/${totals.angkatan} = ${formatPercent(aPct)})`,
  );
  console.log(
    `Semua        : ${allReached ? "✅ Quorum terpenuhi" : "❌ Belum quorum"}`,
  );
}

async function main() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Set CONTRACT_ADDRESS dulu, misalnya: CONTRACT_ADDRESS=0x... npm run interact:localhost",
    );
  }

  const [signer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "VotingARA",
    CONTRACT_ADDRESS,
    signer,
  );

  console.log(`Interact script ready for signer ${signer.address}`);
  console.log(`Contract address: ${CONTRACT_ADDRESS}`);

  await showCandidates(contract);
  try {
    await showWinner(contract);
  } catch (error) {
    console.log("\n=== PEMENANG ===");
    console.log("Belum bisa ditampilkan karena voting belum difinalisasi.");
  }
  await showQuorum(contract);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

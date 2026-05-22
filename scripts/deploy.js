const hre = require("hardhat");

async function main() {
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
  ] = await hre.ethers.getSigners();

  const VotingARA = await hre.ethers.getContractFactory("VotingARA");
  const contract = await VotingARA.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`VotingARA deployed by ${owner.address}`);
  console.log(`Contract address: ${address}`);

  // Set deadline 7 hari
  await contract.setDeadline(7 * 24 * 60 * 60);
  console.log("Deadline set: 7 days");

  // Tambah kandidat
  await contract.addCandidate("Rayy", "Calon Project Officer No. Urut 1");
  await contract.addCandidate("Opung", "Calon Project Officer No. Urut 2");
  console.log("Candidates added: 2");

  // Register voters
  // FUNGSIONARIS (weight 3) — akun #1, #2
  await contract.registerVoter(v1.address, 0);
  await contract.registerVoter(v2.address, 0);

  // WARGA_HMIT (weight 2) — akun #3, #4, #5
  await contract.registerVoter(v3.address, 1);
  await contract.registerVoter(v4.address, 1);
  await contract.registerVoter(v5.address, 1);

  // ANGKATAN_2025 (weight 1) — akun #6 s/d #15
  await contract.registerVoter(v6.address, 2);
  await contract.registerVoter(v7.address, 2);
  await contract.registerVoter(v8.address, 2);
  await contract.registerVoter(v9.address, 2);
  await contract.registerVoter(v10.address, 2);
  await contract.registerVoter(v11.address, 2);
  await contract.registerVoter(v12.address, 2);
  await contract.registerVoter(v13.address, 2);
  await contract.registerVoter(v14.address, 2);
  await contract.registerVoter(v15.address, 2);

  console.log("Voters registered: 15");
  console.log("Deploy complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

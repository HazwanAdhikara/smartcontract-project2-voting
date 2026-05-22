const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const DAY = 24 * 60 * 60;
const WEEK = 7 * DAY;

const EntityType = {
  FUNGSIONARIS: 0,
  WARGA_HMIT: 1,
  ANGKATAN_2025: 2,
};

async function hardhatIncreaseTime(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

async function deployVotingARA() {
  const [deployer] = await ethers.getSigners();
  const VotingARA = await ethers.getContractFactory("VotingARA");
  const contract = await VotingARA.connect(deployer).deploy();
  await contract.waitForDeployment();
  return contract;
}

async function setupVoting(
  contract,
  owner,
  candidateNames = ["Candidate One", "Candidate Two"],
) {
  await contract.connect(owner).setDeadline(WEEK);

  for (let i = 0; i < candidateNames.length; i++) {
    await contract
      .connect(owner)
      .addCandidate(candidateNames[i], `Division ${i + 1}`);
  }
}

async function registerGroup(contract, owner, signers, entity) {
  await contract.connect(owner).registerVotersBatch(
    signers.map((signer) => signer.address),
    entity,
  );
}

describe("VotingARA", function () {
  it("should set deployer as owner", async function () {
    const [deployer] = await ethers.getSigners();
    const contract = await deployVotingARA();

    expect(await contract.owner()).to.equal(deployer.address);
  });

  it("should initialize with zero candidates and zero voters", async function () {
    const contract = await deployVotingARA();

    expect(await contract.getAllCandidates()).to.deep.equal([]);
    expect(await contract.totalFungsionaris()).to.equal(0n);
    expect(await contract.totalWargaHMIT()).to.equal(0n);
    expect(await contract.totalAngkatan2025()).to.equal(0n);
    expect(await contract.votedFungsionaris()).to.equal(0n);
    expect(await contract.votedWargaHMIT()).to.equal(0n);
    expect(await contract.votedAngkatan2025()).to.equal(0n);
  });

  it("should allow owner to add candidate", async function () {
    const [owner] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await contract.connect(owner).setDeadline(WEEK);

    await expect(
      contract.connect(owner).addCandidate("Project Manager", "PM Division"),
    )
      .to.emit(contract, "CandidateAdded")
      .withArgs(0, "Project Manager", "PM Division");

    const candidate = await contract.getCandidate(0);
    expect(candidate.id).to.equal(0n);
    expect(candidate.name).to.equal("Project Manager");
    expect(candidate.division).to.equal("PM Division");
    expect(candidate.voteWeight).to.equal(0n);
    expect(candidate.voteCount).to.equal(0n);
  });

  it("should reject non-owner adding candidate", async function () {
    const [, attacker] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await contract.setDeadline(WEEK);

    await expect(
      contract.connect(attacker).addCandidate("Project Manager", "PM Division"),
    ).to.be.revertedWithCustomError(contract, "NotOwner");
  });

  it("should register voter with correct entity and weight", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.WARGA_HMIT);

    const info = await contract.getVoterInfo(voter.address);
    expect(info.isRegistered).to.equal(true);
    expect(info.hasVoted).to.equal(false);
    expect(info.entity).to.equal(EntityType.WARGA_HMIT);
    expect(info.votedCandidateId).to.equal(2n ** 256n - 1n);
    expect(await contract.totalWargaHMIT()).to.equal(1n);
    expect(await contract.getWeight(EntityType.WARGA_HMIT)).to.equal(2n);
  });

  it("should reject registering same voter twice", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.FUNGSIONARIS);

    await expect(
      contract
        .connect(owner)
        .registerVoter(voter.address, EntityType.FUNGSIONARIS),
    ).to.be.revertedWithCustomError(contract, "AlreadyRegistered");
  });

  it("should allow registered voter to vote and update voteWeight correctly", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);
    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.FUNGSIONARIS);

    await contract.connect(voter).vote(0);

    const candidate = await contract.getCandidate(0);
    const info = await contract.getVoterInfo(voter.address);

    expect(candidate.voteWeight).to.equal(3n);
    expect(candidate.voteCount).to.equal(1n);
    expect(info.hasVoted).to.equal(true);
    expect(info.votedCandidateId).to.equal(0n);
    expect(await contract.votedFungsionaris()).to.equal(1n);
  });

  it("should emit Voted event with correct weight", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);
    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.FUNGSIONARIS);

    await expect(contract.connect(voter).vote(1))
      .to.emit(contract, "Voted")
      .withArgs(voter.address, 1, 3, EntityType.FUNGSIONARIS);
  });

  it("should reject unregistered address from voting", async function () {
    const [, outsider] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, (await ethers.getSigners())[0]);

    await expect(
      contract.connect(outsider).vote(0),
    ).to.be.revertedWithCustomError(contract, "NotRegistered");
  });

  it("should reject double voting from same voter", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);
    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.WARGA_HMIT);

    await contract.connect(voter).vote(0);

    await expect(contract.connect(voter).vote(1)).to.be.revertedWithCustomError(
      contract,
      "AlreadyVoted",
    );
  });

  it("should add weight 3 for FUNGSIONARIS votes", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);
    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.FUNGSIONARIS);

    await contract.connect(voter).vote(0);

    const candidate = await contract.getCandidate(0);
    expect(candidate.voteWeight).to.equal(3n);
  });

  it("should add weight 1 for ANGKATAN_2025 votes and stay below WARGA_HMIT weight 2", async function () {
    const [owner, angkatanVoter, wargaVoter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner, ["Candidate One", "Candidate Two"]);
    await contract
      .connect(owner)
      .registerVoter(angkatanVoter.address, EntityType.ANGKATAN_2025);
    await contract
      .connect(owner)
      .registerVoter(wargaVoter.address, EntityType.WARGA_HMIT);

    await contract.connect(angkatanVoter).vote(0);
    await contract.connect(wargaVoter).vote(1);

    const angkatanCandidate = await contract.getCandidate(0);
    const wargaCandidate = await contract.getCandidate(1);

    expect(angkatanCandidate.voteWeight).to.equal(1n);
    expect(wargaCandidate.voteWeight).to.equal(2n);
    expect(angkatanCandidate.voteWeight).to.be.lessThan(
      wargaCandidate.voteWeight,
    );
  });

  it("should reject vote after deadline", async function () {
    const [owner, voter] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await contract.connect(owner).setDeadline(2);
    await contract.connect(owner).addCandidate("Candidate One", "Division 1");
    await contract
      .connect(owner)
      .registerVoter(voter.address, EntityType.FUNGSIONARIS);

    await hardhatIncreaseTime(3);

    await expect(contract.connect(voter).vote(0)).to.be.revertedWithCustomError(
      contract,
      "VotingNotActive",
    );
  });

  it("should allow owner to set deadline correctly", async function () {
    const [owner] = await ethers.getSigners();
    const contract = await deployVotingARA();

    const tx = await contract.connect(owner).setDeadline(WEEK);
    const receipt = await tx.wait();
    const minedBlock = await ethers.provider.getBlock(receipt.blockNumber);

    await expect(tx).to.emit(contract, "DeadlineSet");

    expect(await contract.votingDeadline()).to.equal(
      BigInt(minedBlock.timestamp + WEEK),
    );
    expect(await contract.getTimeRemaining()).to.equal(WEEK);
  });

  it("should report quorum not met if less than 30 percent of each entity voted", async function () {
    const [owner, ...signers] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner, ["Candidate One", "Candidate Two"]);

    await registerGroup(
      contract,
      owner,
      signers.slice(0, 4),
      EntityType.FUNGSIONARIS,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(4, 8),
      EntityType.WARGA_HMIT,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(8, 12),
      EntityType.ANGKATAN_2025,
    );

    await contract.connect(signers[0]).vote(0);
    await contract.connect(signers[4]).vote(0);
    await contract.connect(signers[8]).vote(0);

    const [fReached, wReached, aReached, allReached] =
      await contract.getQuorumStatus();
    expect(fReached).to.equal(false);
    expect(wReached).to.equal(false);
    expect(aReached).to.equal(false);
    expect(allReached).to.equal(false);
  });

  it("should allow finalize only when quorum met and deadline passed", async function () {
    const [owner, ...signers] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner, ["Candidate One", "Candidate Two"]);

    await registerGroup(
      contract,
      owner,
      signers.slice(0, 4),
      EntityType.FUNGSIONARIS,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(4, 8),
      EntityType.WARGA_HMIT,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(8, 12),
      EntityType.ANGKATAN_2025,
    );

    for (let i = 0; i < 2; i++) {
      await contract.connect(signers[i]).vote(0);
      await contract.connect(signers[4 + i]).vote(0);
      await contract.connect(signers[8 + i]).vote(0);
    }

    await hardhatIncreaseTime(WEEK + 1);

    await expect(contract.connect(owner).finalize()).to.emit(
      contract,
      "VotingFinalized",
    );

    expect(await contract.isFinalized()).to.equal(true);
  });

  it("should finalize and return correct winner by weighted votes", async function () {
    const [owner, ...signers] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner, ["Alpha", "Beta"]);

    await registerGroup(
      contract,
      owner,
      signers.slice(0, 4),
      EntityType.FUNGSIONARIS,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(4, 8),
      EntityType.WARGA_HMIT,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(8, 12),
      EntityType.ANGKATAN_2025,
    );

    await contract.connect(signers[0]).vote(0);
    await contract.connect(signers[1]).vote(0);
    await contract.connect(signers[4]).vote(0);
    await contract.connect(signers[5]).vote(1);
    await contract.connect(signers[8]).vote(1);
    await contract.connect(signers[9]).vote(1);

    await hardhatIncreaseTime(WEEK + 1);
    await contract.connect(owner).finalize();

    const winner = await contract.getWinner();
    expect(winner.id).to.equal(0n);
    expect(winner.name).to.equal("Alpha");
    expect(winner.voteWeight).to.equal(8n);
  });

  it("should reject finalize if quorum not met", async function () {
    const [owner, ...signers] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);

    await registerGroup(
      contract,
      owner,
      signers.slice(0, 4),
      EntityType.FUNGSIONARIS,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(4, 8),
      EntityType.WARGA_HMIT,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(8, 12),
      EntityType.ANGKATAN_2025,
    );

    await contract.connect(signers[0]).vote(0);
    await contract.connect(signers[4]).vote(0);
    await contract.connect(signers[8]).vote(0);

    await hardhatIncreaseTime(WEEK + 1);

    await expect(
      contract.connect(owner).finalize(),
    ).to.be.revertedWithCustomError(contract, "QuorumNotMet");
  });

  it("should reject finalize from non-owner", async function () {
    const [owner, outsider, ...signers] = await ethers.getSigners();
    const contract = await deployVotingARA();

    await setupVoting(contract, owner);

    await registerGroup(
      contract,
      owner,
      signers.slice(0, 4),
      EntityType.FUNGSIONARIS,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(4, 8),
      EntityType.WARGA_HMIT,
    );
    await registerGroup(
      contract,
      owner,
      signers.slice(8, 12),
      EntityType.ANGKATAN_2025,
    );

    for (let i = 0; i < 2; i++) {
      await contract.connect(signers[i]).vote(0);
      await contract.connect(signers[4 + i]).vote(0);
      await contract.connect(signers[8 + i]).vote(0);
    }

    await hardhatIncreaseTime(WEEK + 1);

    await expect(
      contract.connect(outsider).finalize(),
    ).to.be.revertedWithCustomError(contract, "NotOwner");
  });
});

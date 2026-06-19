export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "function getAllCandidates() view returns ((uint256 id, string name, string division, uint256 voteWeight, uint256 voteCount)[])",
  "function vote(uint256 _candidateId) external",
  "function getVoterInfo(address _voter) view returns ((bool isRegistered, bool hasVoted, uint8 entity, uint256 votedCandidateId))",
  "function getQuorumStatus() view returns (bool fungsionarisReached, bool wargaReached, bool angkatanReached, bool allReached)",
  "function getTimeRemaining() view returns (uint256)",
  "function getTotalWeightedVotes() view returns (uint256)",
  "function isFinalized() view returns (bool)",
  "function finalize() external",
  "function owner() view returns (address)",
  "event Voted(address indexed voter, uint256 indexed candidateId, uint256 weight, uint8 entity)",
  "event VotingFinalized(uint256 indexed winnerId, string winnerName, uint256 totalWeightedVotes)"
];
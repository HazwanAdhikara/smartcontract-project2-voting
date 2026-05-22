// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VotingARA
/// @notice On-chain weighted voting contract for the ARA 8.0 project officer election.
contract VotingARA {
    /// @notice Defines the voter entity group.
    enum EntityType {
        FUNGSIONARIS,
        WARGA_HMIT,
        ANGKATAN_2025
    }

    /// @notice Stores candidate information.
    struct Candidate {
        uint256 id;
        string name;
        string division;
        uint256 voteWeight;
        uint256 voteCount;
    }

    /// @notice Stores voter information.
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        EntityType entity;
        uint256 votedCandidateId;
    }

    /// @notice Weight for FUNGSIONARIS votes.
    uint256 public constant WEIGHT_FUNGSIONARIS = 3;
    /// @notice Weight for WARGA_HMIT votes.
    uint256 public constant WEIGHT_WARGA_HMIT = 2;
    /// @notice Weight for ANGKATAN_2025 votes.
    uint256 public constant WEIGHT_ANGKATAN_2025 = 1;
    /// @notice Minimum quorum threshold in percent per entity.
    uint256 public constant QUORUM_THRESHOLD = 30;

    /// @notice Contract owner.
    address public owner;
    /// @notice Voting deadline as unix timestamp.
    uint256 public votingDeadline;
    /// @notice Indicates whether the election has been finalized.
    bool public isFinalized;
    /// @notice Indicates whether a deadline has already been set.
    bool public deadlineSet;
    /// @notice Total registered FUNGSIONARIS voters.
    uint256 public totalFungsionaris;
    /// @notice Total registered WARGA_HMIT voters.
    uint256 public totalWargaHMIT;
    /// @notice Total registered ANGKATAN_2025 voters.
    uint256 public totalAngkatan2025;
    /// @notice Total FUNGSIONARIS voters who have voted.
    uint256 public votedFungsionaris;
    /// @notice Total WARGA_HMIT voters who have voted.
    uint256 public votedWargaHMIT;
    /// @notice Total ANGKATAN_2025 voters who have voted.
    uint256 public votedAngkatan2025;
    /// @notice Array of candidates.
    Candidate[] private candidates;
    /// @notice Registry of voters.
    mapping(address => Voter) private voters;
    /// @notice Winner candidate id after finalization.
    uint256 private winningCandidateId;

    error NotOwner();
    error DeadlineAlreadySet();
    error InvalidDuration();
    error VotingNotActive();
    error VotingNotEnded();
    error AlreadyRegistered();
    error InvalidAddress();
    error NotRegistered();
    error AlreadyVoted();
    error InvalidCandidateId();
    error NoCandidates();
    error VotingNotFinalized();
    error QuorumNotMet();
    error AlreadyFinalized();

    event CandidateAdded(uint256 indexed candidateId, string name, string division);
    event VoterRegistered(address indexed voter, EntityType entity);
    event Voted(address indexed voter, uint256 indexed candidateId, uint256 weight, EntityType entity);
    event VotingFinalized(uint256 indexed winnerId, string winnerName, uint256 totalWeightedVotes);
    event DeadlineSet(uint256 deadline);

    /// @notice Deploys the contract and assigns the deployer as owner.
    constructor() {
        owner = msg.sender;
    }

    /// @notice Restricts access to the owner.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @notice Allows calls only while voting is active.
    modifier votingActive() {
        if (votingDeadline == 0 || block.timestamp >= votingDeadline || isFinalized) revert VotingNotActive();
        _;
    }

    /// @notice Allows calls only after voting ends or after finalization.
    modifier votingEnded() {
        if (votingDeadline == 0 || (!isFinalized && block.timestamp < votingDeadline)) revert VotingNotEnded();
        _;
    }

    /// @notice Restricts access to registered voters.
    modifier onlyRegisteredVoter() {
        if (!voters[msg.sender].isRegistered) revert NotRegistered();
        _;
    }

    /// @notice Sets the voting deadline in seconds from the current block timestamp.
    /// @param _duration Duration in seconds from now.
    function setDeadline(uint256 _duration) external onlyOwner {
        if (deadlineSet) revert DeadlineAlreadySet();
        if (_duration == 0) revert InvalidDuration();

        votingDeadline = block.timestamp + _duration;
        deadlineSet = true;

        emit DeadlineSet(votingDeadline);
    }

    /// @notice Adds a new candidate before the voting deadline.
    /// @param _name Candidate name.
    /// @param _division Divisi or position applied for.
    function addCandidate(string calldata _name, string calldata _division) external onlyOwner votingActive {
        uint256 candidateId = candidates.length;

        candidates.push(
            Candidate({
                id: candidateId,
                name: _name,
                division: _division,
                voteWeight: 0,
                voteCount: 0
            })
        );

        emit CandidateAdded(candidateId, _name, _division);
    }

    /// @notice Registers a single voter for a specific entity.
    /// @param _voter Voter address.
    /// @param _entity Voter entity type.
    function registerVoter(address _voter, EntityType _entity) public onlyOwner {
        _registerVoter(_voter, _entity);
    }

    /// @notice Registers multiple voters with the same entity.
    /// @param _voters Array of voter addresses.
    /// @param _entity Voter entity type.
    function registerVotersBatch(address[] calldata _voters, EntityType _entity) external onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            _registerVoter(_voters[i], _entity);
        }
    }

    /// @notice Casts a single vote for a candidate.
    /// @param _candidateId Candidate id.
    function vote(uint256 _candidateId) external onlyRegisteredVoter votingActive {
        Voter storage voter = voters[msg.sender];
        if (voter.hasVoted) revert AlreadyVoted();
        if (_candidateId >= candidates.length) revert InvalidCandidateId();

        uint256 weight = _getWeight(voter.entity);
        Candidate storage candidate = candidates[_candidateId];

        candidate.voteWeight += weight;
        candidate.voteCount += 1;
        voter.hasVoted = true;
        voter.votedCandidateId = _candidateId;

        if (voter.entity == EntityType.FUNGSIONARIS) {
            votedFungsionaris += 1;
        } else if (voter.entity == EntityType.WARGA_HMIT) {
            votedWargaHMIT += 1;
        } else {
            votedAngkatan2025 += 1;
        }

        emit Voted(msg.sender, _candidateId, weight, voter.entity);
    }

    /// @notice Finalizes the election and stores the winning candidate.
    function finalize() external onlyOwner votingEnded {
        if (isFinalized) revert AlreadyFinalized();
        if (candidates.length == 0) revert NoCandidates();
        if (!_isQuorumMet()) revert QuorumNotMet();

        uint256 winnerId = 0;
        uint256 highestWeight = candidates[0].voteWeight;

        for (uint256 i = 1; i < candidates.length; i++) {
            if (candidates[i].voteWeight > highestWeight) {
                highestWeight = candidates[i].voteWeight;
                winnerId = i;
            }
        }

        isFinalized = true;
        winningCandidateId = winnerId;

        Candidate memory winner = candidates[winnerId];
        uint256 totalWeightedVotes = _getTotalWeightedVotes();

        emit VotingFinalized(winner.id, winner.name, totalWeightedVotes);
    }

    /// @notice Returns a candidate by id.
    /// @param _id Candidate id.
    /// @return Candidate struct for the requested id.
    function getCandidate(uint256 _id) external view returns (Candidate memory) {
        if (_id >= candidates.length) revert InvalidCandidateId();
        return candidates[_id];
    }

    /// @notice Returns all candidates.
    /// @return Array of all candidates.
    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /// @notice Returns voter information for a given address.
    /// @param _voter Voter address.
    /// @return Voter struct for the requested address.
    function getVoterInfo(address _voter) external view returns (Voter memory) {
        return voters[_voter];
    }

    /// @notice Returns the winner after finalization.
    /// @return Winning candidate struct.
    function getWinner() external view returns (Candidate memory) {
        if (!isFinalized) revert VotingNotFinalized();
        return candidates[winningCandidateId];
    }

    /// @notice Returns quorum status for all entities.
    /// @return fungsionarisReached Whether FUNGSIONARIS quorum is met.
    /// @return wargaReached Whether WARGA_HMIT quorum is met.
    /// @return angkatanReached Whether ANGKATAN_2025 quorum is met.
    /// @return allReached Whether all entity quorums are met.
    function getQuorumStatus()
        external
        view
        returns (bool fungsionarisReached, bool wargaReached, bool angkatanReached, bool allReached)
    {
        fungsionarisReached = _isQuorumReached(totalFungsionaris, votedFungsionaris);
        wargaReached = _isQuorumReached(totalWargaHMIT, votedWargaHMIT);
        angkatanReached = _isQuorumReached(totalAngkatan2025, votedAngkatan2025);
        allReached = fungsionarisReached && wargaReached && angkatanReached;
    }

    /// @notice Returns the time left until the deadline.
    /// @return Remaining seconds, or zero if the deadline already passed.
    function getTimeRemaining() external view returns (uint256) {
        if (votingDeadline <= block.timestamp) {
            return 0;
        }

        return votingDeadline - block.timestamp;
    }

    /// @notice Returns the sum of all weighted votes.
    /// @return Total weighted vote count.
    function getTotalWeightedVotes() external view returns (uint256) {
        return _getTotalWeightedVotes();
    }

    /// @notice Returns the weight for a voter entity.
    /// @param _entity Voter entity type.
    /// @return Weight assigned to the entity.
    function getWeight(EntityType _entity) external pure returns (uint256) {
        return _getWeight(_entity);
    }

    /// @notice Registers a voter and updates entity counters.
    /// @param _voter Voter address.
    /// @param _entity Voter entity type.
    function _registerVoter(address _voter, EntityType _entity) internal {
        if (_voter == address(0)) revert InvalidAddress();
        if (voters[_voter].isRegistered) revert AlreadyRegistered();

        voters[_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            entity: _entity,
            votedCandidateId: type(uint256).max
        });

        if (_entity == EntityType.FUNGSIONARIS) {
            totalFungsionaris += 1;
        } else if (_entity == EntityType.WARGA_HMIT) {
            totalWargaHMIT += 1;
        } else {
            totalAngkatan2025 += 1;
        }

        emit VoterRegistered(_voter, _entity);
    }

    /// @notice Returns the configured weight for an entity.
    /// @param _entity Entity type.
    /// @return Weight for the entity.
    function _getWeight(EntityType _entity) internal pure returns (uint256) {
        if (_entity == EntityType.FUNGSIONARIS) return WEIGHT_FUNGSIONARIS;
        if (_entity == EntityType.WARGA_HMIT) return WEIGHT_WARGA_HMIT;
        return WEIGHT_ANGKATAN_2025;
    }

    /// @notice Checks whether quorum is met for an entity.
    /// @param _totalRegistered Total registered voters for the entity.
    /// @param _voted Total voters from the entity who have voted.
    /// @return True if quorum is met or the entity has no voters.
    function _isQuorumReached(uint256 _totalRegistered, uint256 _voted) internal pure returns (bool) {
        if (_totalRegistered == 0) {
            return true;
        }

        return (_voted * 100) / _totalRegistered >= QUORUM_THRESHOLD;
    }

    /// @notice Checks whether the global quorum requirement is met.
    /// @return True if every entity reached the quorum threshold.
    function _isQuorumMet() internal view returns (bool) {
        return
            _isQuorumReached(totalFungsionaris, votedFungsionaris) &&
            _isQuorumReached(totalWargaHMIT, votedWargaHMIT) &&
            _isQuorumReached(totalAngkatan2025, votedAngkatan2025);
    }

    /// @notice Calculates the sum of all candidate weighted votes.
    /// @return totalWeightedVotes Total weighted votes across all candidates.
    function _getTotalWeightedVotes() internal view returns (uint256 totalWeightedVotes) {
        for (uint256 i = 0; i < candidates.length; i++) {
            totalWeightedVotes += candidates[i].voteWeight;
        }
    }
}
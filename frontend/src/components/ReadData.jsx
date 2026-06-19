import React from 'react';
import QuorumBar from './QuorumBar';

export default function ReadData({ timeRemaining, quorum, isFinalized, quorumDetails, isAdmin }) {
  const renderCountdown = (secStr) => {
    const totalSec = parseInt(secStr, 10);
    if (isNaN(totalSec) || totalSec <= 0) return "Terminated";
    
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const showQuorumDetails = isAdmin || isFinalized;

  return (
    <div className="grid-metrics">
      <div className="crypto-card metric-box">
        <span className="label-muted">Time Counter</span>
        <div className="value-highlight" style={{ color: '#00e5ff' }}>{renderCountdown(timeRemaining)}</div>
      </div>

      <div className="crypto-card metric-box">
        <span className="label-muted">Lifecycle Status</span>
        <div style={{ marginTop: '4px' }}>
          <span className={`status-indicator ${isFinalized ? 'done' : 'live'}`}>
            {isFinalized ? "Finalized" : "Live Option Open"}
          </span>
        </div>
      </div>

      <div className="crypto-card metric-box" style={{ gap: '4px' }}>
        <QuorumBar 
          label="Fungsionaris Quorum"
          currentVotes={quorumDetails.votedFungsionaris}
          totalRegistered={quorumDetails.totalFungsionaris}
          isComplete={quorum.fungsionaris}
          showDetails={showQuorumDetails}
        />
        <QuorumBar 
          label="Warga HMIT Quorum"
          currentVotes={quorumDetails.votedWarga}
          totalRegistered={quorumDetails.totalWarga}
          isComplete={quorum.warga}
          showDetails={showQuorumDetails}
        />
        <QuorumBar 
          label="Angkatan 2025 Quorum"
          currentVotes={quorumDetails.votedAngkatan}
          totalRegistered={quorumDetails.totalAngkatan}
          isComplete={quorum.angkatan}
          showDetails={showQuorumDetails}
        />
      </div>
    </div>
  );
}
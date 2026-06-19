import React from 'react';

export default function WriteAction({ candidates, loading, isFinalized, voterInfo, isAdmin, handleVote, handleFinalize, handleFastForward, handleBack }) {
  const showDetails = isAdmin || isFinalized;

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>
        Bilik Suara Digital
      </h2>
      
      <div className="grid-ballot">
        {candidates.map((candidate) => {
          const cid = Number(candidate.id);
          return (
            <div key={cid} className="crypto-card ballot-item">
              <div>
                <span className="label-muted" style={{ color: '#ff4181' }}>Kandidat 0{cid + 1}</span>
                <h3 style={{ fontSize: '1.4rem', margin: '8px 0 4px 0', fontWeight: '700' }}>{candidate.name}</h3>
                <p style={{ color: '#9c8da4', fontSize: '0.9rem', margin: '0 0 16px 0' }}>{candidate.division}</p>
                
                <div style={{ fontSize: '0.85rem', color: '#bc9ec1', marginBottom: '20px', display: 'flex', gap: '20px' }}>
                  <div>Voters: <span style={{ color: showDetails ? '#ffffff' : '#bc9ec1', fontWeight: '600' }}>
                    {showDetails ? candidate.voteCount.toString() : "Secret"}
                  </span></div>
                  <div>Weights: <span style={{ color: showDetails ? '#00e5ff' : '#bc9ec1', fontWeight: '600' }}>
                    {showDetails ? candidate.voteWeight.toString() : "Secret"}
                  </span></div>
                </div>
              </div>

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
            </div>
          );
        })}
      </div>

      {/* ADMIN PANEL CONTAINER */}
      {isAdmin && (
        <div className="crypto-card" style={{ marginTop: '40px', borderColor: 'rgba(255, 65, 129, 0.2)', background: 'rgba(255, 65, 129, 0.01)' }}>
          <span className="label-muted" style={{ color: '#ff4181' }}>Admin Panel (Owner Only)</span>
          <h3 style={{ margin: '4px 0 12px 0', fontWeight: '700' }}>Kunci Hasil Sesi Voting</h3>
          
          <p style={{ color: '#9c8da4', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
            Menu khusus owner untuk menutup voting dan mematenkan pemenang di blockchain. Tombol baru aktif setelah countdown selesai dan kuorum minimal 30% dari tiap entitas terpenuhi.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn-premium" 
              disabled={loading || isFinalized}
              onClick={handleFinalize}
            >
              {isFinalized ? "Sesi Pemilihan Sudah Ditutup" : "Tutup & Rekam Hasil Akhir"}
            </button>

            {!isFinalized && (
              <button 
                className="btn-premium outline" 
                disabled={loading}
                onClick={handleFastForward}
              >
                Skip Day
              </button>
            )}

            {/* TOMBOL BACK STRATEGIS: Hanya Muncul Ketika Sesi Sudah Finalized */}
            {isFinalized && (
              <button 
                className="btn-premium outline" 
                onClick={handleBack}
                style={{ borderColor: 'rgba(0, 229, 255, 0.4)', color: '#00e5ff' }}
              >
                ← Back to Landing Page
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
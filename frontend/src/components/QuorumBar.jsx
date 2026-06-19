import React from 'react';

export default function QuorumBar({ label, currentVotes, totalRegistered, isComplete, showDetails }) {
  // Menghitung persentase secara otomatis dan aman dari pembagian dengan angka nol (0)
  const percentage = totalRegistered === 0 ? 100 : Math.min(Math.round((currentVotes / totalRegistered) * 100), 100);
  
  // LOGIKA BARU: Status lengkap (warna pink & centang) HANYA boleh aktif jika showDetails bernilai true
  const displayComplete = isComplete && showDetails;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600' }}>
        <span style={{ color: '#9c8da4' }}>{label}</span>
        
        {/* Warna tulisan hanya akan berubah jadi pink jika displayComplete diizinkan */}
        <span style={{ color: displayComplete ? '#ff4181' : '#bc9ec1' }}>
          {showDetails ? `${percentage}% (${currentVotes}/${totalRegistered})` : "Encrypted (Secret)"} 
          
          {/* Tanda centang hanya akan muncul jika displayComplete diizinkan */}
          {displayComplete && " ✓"}
        </span>
      </div>
      <div className="bar-track">
        <div 
          className={`bar-fill ${displayComplete ? 'complete' : 'incomplete'}`} 
          style={{ width: showDetails ? `${percentage}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}
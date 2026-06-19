import React from 'react';

export default function ConnectWallet({ account, connectWallet, isCorrectNetwork, voterInfo, isAdmin }) {
  const parseEntity = (id) => {
    if (id === 0) return "Fungsionaris (Weight 3)";
    if (id === 1) return "Warga HMIT (Weight 2)";
    return "Angkatan 2025 (Weight 1)";
  };

  const sliceAddress = account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : '';

  return (
    <div className="navigation-bar">
      <div className="brand-section">
        <div className="brand-icon"></div>
        <div>
          <div className="brand-name">ARA 8.0 Platform</div>
          {account && (
            <div style={{ fontSize: '0.8rem', color: '#9c8da4', marginTop: '2px' }}>
              {isAdmin ? "Authority Session (Admin)" : voterInfo.isRegistered ? parseEntity(voterInfo.entity) : "Viewer Session"}
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Tombol lama di sini sudah dihapus. Sekarang hanya menampilkan info address ketika sudah login */}
        {account && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: '600', color: '#00e5ff' }}>
              {sliceAddress}
            </span>
            <span style={{ fontSize: '0.7rem', color: isCorrectNetwork ? '#34d399' : '#ff4181' }}>
              {isCorrectNetwork ? "Network: Localhost Node" : "Network Error"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
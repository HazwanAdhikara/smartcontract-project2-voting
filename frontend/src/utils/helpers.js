export const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Mengubah uint8 entity ID dari Smart Contract menjadi nama peran resmi
 */
export const getEntityName = (entityId) => {
  const id = Number(entityId);
  if (id === 0) return "Fungsionaris (Weight 3)";
  if (id === 1) return "Warga HMIT (Weight 2)";
  return "Angkatan 2025 (Weight 1)";
};

/**
 * Mengubah sisa detik dari blockchain menjadi format teks hitung mundur
 */
export const formatSeconds = (seconds) => {
  if (!seconds || Number(seconds) === 0) return "Waktu Habis";
  const secs = Number(seconds);
  const days = Math.floor(secs / (3600 * 24));
  const hours = Math.floor((secs % (3600 * 24)) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  return `${days} Hari, ${hours} Jam, ${minutes} Menit`;
};
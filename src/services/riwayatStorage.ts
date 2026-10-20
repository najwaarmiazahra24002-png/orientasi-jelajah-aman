import { ambilDatabase } from "../db/database";
import type { HasilGeocoding } from "../types/geocoding";

const MAKSIMAL_RIWAYAT = 10;

export interface RiwayatPencarian {
  id: number;
  kota_id: number;
  nama_kota: string;
  latitude: number;
  longitude: number;
  negara: string;
  dicari_pada: number;
}

// Menyimpan riwayat pencarian kota
export async function simpanRiwayat(
  kota: HasilGeocoding
): Promise<void> {
  const db = await ambilDatabase();

  await db.runAsync(
    `DELETE FROM riwayat_pencarian
     WHERE kota_id = ?`,
    kota.id
  );

  await db.runAsync(
    `INSERT INTO riwayat_pencarian
     (kota_id, nama_kota, latitude, longitude, negara, dicari_pada)
     VALUES (?, ?, ?, ?, ?, ?)`,
    kota.id,
    kota.name,
    kota.latitude,
    kota.longitude,
    kota.country ?? "",
    Date.now()
  );

  // Sisakan hanya 10 pencarian terbaru
  await db.runAsync(
    `DELETE FROM riwayat_pencarian
     WHERE id NOT IN (
       SELECT id FROM riwayat_pencarian
       ORDER BY dicari_pada DESC, id DESC
       LIMIT ?
     )`,
    MAKSIMAL_RIWAYAT
  );
}

// Mengambil riwayat terbaru untuk ditampilkan
export async function ambilRiwayat(): Promise<RiwayatPencarian[]> {
  const db = await ambilDatabase();

  return db.getAllAsync<RiwayatPencarian>(
    `SELECT *
     FROM riwayat_pencarian
     ORDER BY dicari_pada DESC, id DESC
     LIMIT ?`,
    MAKSIMAL_RIWAYAT
  );
}

// Menghapus semua riwayat pencarian
export async function hapusSemuaRiwayat(): Promise<void> {
  const db = await ambilDatabase();

  await db.runAsync("DELETE FROM riwayat_pencarian");
}
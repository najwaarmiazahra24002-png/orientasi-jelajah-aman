// src/context/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tiga pilihan mode yang diminta soal
export type ModeTema = "terang" | "gelap" | "sistem";

// Daftar warna untuk mode terang
const warnaTerang = {
  latar: "#F5F7FA", // background layar
  kartu: "#FFFFFF", // background kartu / input
  teks: "#1A1A1A", // teks utama
  teksPudar: "#666666", // teks keterangan
  garis: "#DDDDDD", // garis pemisah
  aksen: "#2563EB", // warna tab aktif / tombol utama
  bahaya: "#D9534F", // warna tombol hapus
};

// Daftar warna untuk mode gelap (kunci harus sama dengan mode terang)
const warnaGelap: typeof warnaTerang = {
  latar: "#0F172A",
  kartu: "#1E293B",
  teks: "#F1F5F9",
  teksPudar: "#94A3B8",
  garis: "#334155",
  aksen: "#60A5FA",
  bahaya: "#F87171",
};

type NilaiTema = {
  mode: ModeTema; // pilihan user saat ini
  ubahMode: (mode: ModeTema) => void; // fungsi untuk mengganti pilihan
  warna: typeof warnaTerang; // warna yang sedang dipakai
  gelap: boolean; // true kalau tampilan sedang gelap
};

const TemaContext = createContext<NilaiTema | null>(null);

// Kunci penyimpanan lokal
const KUNCI_TEMA = "mode_tema";

export function TemaProvider({ children }: { children: ReactNode }) {
  // Mode tema bawaan HP / browser (terang atau gelap)
  const skemaSistem = useColorScheme();
  const [mode, setMode] = useState<ModeTema>("sistem");

  // Saat aplikasi dibuka, ambil pilihan yang pernah disimpan
  useEffect(() => {
    AsyncStorage.getItem(KUNCI_TEMA)
      .then((tersimpan) => {
        if (
          tersimpan === "terang" ||
          tersimpan === "gelap" ||
          tersimpan === "sistem"
        ) {
          setMode(tersimpan);
        }
      })
      .catch((err) => console.error("Gagal membaca tema:", err));
  }, []);

  // Ganti mode sekaligus simpan ke perangkat
  function ubahMode(modeBaru: ModeTema) {
    setMode(modeBaru);
    AsyncStorage.setItem(KUNCI_TEMA, modeBaru).catch((err) =>
      console.error("Gagal menyimpan tema:", err),
    );
  }

  // Kalau "sistem", ikuti pengaturan HP; kalau tidak, ikuti pilihan user
  const gelap = mode === "sistem" ? skemaSistem === "dark" : mode === "gelap";
  const warna = gelap ? warnaGelap : warnaTerang;

  return (
    <TemaContext.Provider value={{ mode, ubahMode, warna, gelap }}>
      {children}
    </TemaContext.Provider>
  );
}

// Dipakai di setiap layar: const { warna } = useTema();
export function useTema() {
  const nilai = useContext(TemaContext);
  if (!nilai) {
    throw new Error("useTema harus dipakai di dalam TemaProvider");
  }
  return nilai;
}
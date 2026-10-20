import { useState, useCallback } from "react";
import { View, Text, Button, Alert, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// UTS - Fitur 2
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";

import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import type { KotaFavorit } from "../../types/favorit";

// UTS - Fitur 2
import { ambilRiwayat } from "../../services/riwayatStorage";
import type { RiwayatPencarian } from "../../services/riwayatStorage";

// UTS - Fitur 3
import { buatKunci, hapusCacheKota } from "../../services/cacheRepository";

// UTS - Fitur 4
import { useTema } from "../../context/ThemeContext";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  // UTS - Fitur 2
  const [daftarRiwayat, setDaftarRiwayat] = useState<RiwayatPencarian[]>([]);
  // UTS - Fitur 4
  const { warna } = useTema();

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit()
        .then(setDaftarFavorit)
        .catch((err) => console.error("Gagal mengambil favorit:", err));
    }, []),
  );

  // UTS - Fitur 2 : Memuat riwayat pencarian saat tab dibuka
  useFocusEffect(
    useCallback(() => {
      ambilRiwayat()
        .then(setDaftarRiwayat)
        .catch((err) => console.error("Gagal mengambil riwayat:", err));
    }, []),
  );

  async function hapus(id: number) {
    await hapusFavorit(id);
    setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
  }

  function konfirmasiHapus(kota: KotaFavorit) {
    if (Platform.OS === "web") {
      if (window.confirm(`Yakin hapus ${kota.nama}?`)) {
        hapus(kota.id);
      }
      return;
    }

    Alert.alert("Konfirmasi", `Yakin hapus ${kota.nama}?`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => hapus(kota.id) },
    ]);
  }

  // UTS - Fitur 3 : Menghapus cache cuaca tanpa menghapus riwayat pencarian
  async function hapusCache(kota: RiwayatPencarian) {
    try {
      const kunci = buatKunci(kota.latitude, kota.longitude);
      await hapusCacheKota(kunci);

      if (Platform.OS === "web") {
        window.alert(`Cache cuaca ${kota.nama_kota} berhasil dihapus.`);
      } else {
        Alert.alert(
          "Berhasil",
          `Cache cuaca ${kota.nama_kota} berhasil dihapus.`,
        );
      }
    } catch (error) {
      console.error("Gagal menghapus cache:", error);

      if (Platform.OS === "web") {
        window.alert("Cache kota gagal dihapus.");
      } else {
        Alert.alert("Gagal", "Cache kota gagal dihapus.");
      }
    }
  }

  // UTS - Fitur 3 : Konfirmasi sebelum cache dihapus
  function konfirmasiHapusCache(kota: RiwayatPencarian) {
    const pesan = `Yakin ingin menghapus cache cuaca ${kota.nama_kota} dari perangkat?`;

    if (Platform.OS === "web") {
      if (window.confirm(pesan)) {
        void hapusCache(kota);
      }
      return;
    }

    Alert.alert("Konfirmasi Hapus Cache", pesan, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus Cache",
        style: "destructive",
        onPress: () => {
          void hapusCache(kota);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12, backgroundColor: warna.latar }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", color: warna.teks }}>Kota Favorit</Text>

      {/*  UTS - fitur 4 : tambah color, warna.tekss */}
      <Text style={{ color: warna.teks }}>Tersimpan {daftarFavorit.length} kota</Text>

      {daftarFavorit.length === 0 && (<Text style={{ color: warna.teks }}>Belum ada kota favorit</Text>)}

      {daftarFavorit.map((kota) => (
        <View
          key={kota.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: warna.teks }}>{kota.nama}</Text>
          <Button title="Hapus" onPress={() => konfirmasiHapus(kota)} />
        </View>
      ))}

      {/* UTS - Fitur 2 */}
      <View style={{ marginTop: 24, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: warna.teks }}>
          Riwayat Pencarian
        </Text>

        <Text style={{ color: warna.teks }}>Tersimpan {daftarRiwayat.length} dari 10 pencarian</Text>

        {daftarRiwayat.length === 0 && <Text style={{ color: warna.teks }}>Belum ada riwayat pencarian</Text>}

        {daftarRiwayat.map((kota) => (
          <View
            key={`${kota.id}-${kota.kota_id}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: warna.garis,
            }}
          >
            {/* Nama kota bisa ditekan untuk membuka cuaca */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)",
                  params: {
                    riwayatId: String(kota.kota_id),
                    nama: kota.nama_kota,
                    lat: String(kota.latitude),
                    lon: String(kota.longitude),
                    negara: kota.negara,
                  },
                })
              }
            >
              <Text style={{ fontSize: 16, fontWeight: "500", color: warna.teks }}>
                {kota.nama_kota}
              </Text>
              
              <Text style={{ fontSize: 12, color: warna.teksPudar }}>{kota.negara}</Text>
            </TouchableOpacity>

            {/* UTS - Fitur 3 : tombol hapus di samping nama kota */}
            <Button
              title="Hapus Cache"
              // UTS - fitur 4
              color={warna.bahaya}
              onPress={() => konfirmasiHapusCache(kota)}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

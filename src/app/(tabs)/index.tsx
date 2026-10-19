// src/app/(tabs)/index.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";
import { router, useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView, // TAMBAHAN OFFLINE-FIRST: wadah agar halaman dapat di-scroll
  ActivityIndicator,
  Button,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import StatusData from "../../components/StatusData"; // TAMBAHAN OFFLINE-FIRST: menampilkan sumber/status data
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";

// TAMBAHAN OFFLINE-FIRST: mengambil cuaca dari cache atau sumber online
import {ambilCuacaOfflineFirst, BATAS_CACHE_MS,} from "../../services/cuacaRepository";

// TAMBAHAN OFFLINE-FIRST: mengelola cache cuaca tersimpan
import {bersihkanCacheLama, daftarKotaTersimpan,} from "../../services/cacheRepository";

import { konversiTingkatAQI } from "../../services/weatherAdapter";

// Fitur lama: memuat daftar favorit
import { ambilSemuaFavorit } from "../../services/favoritStorage";

import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";

// TAMBAHAN OFFLINE-FIRST: tipe hasil cuaca dan ringkasan cache
import {
  HasilCuacaOffline,
  RingkasanKotaTersimpan,
} from "../../types/cache";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);

  // TAMBAHAN OFFLINE-FIRST: menggantikan dua state cuaca lama dengan hasil repository
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);

  // TAMBAHAN OFFLINE-FIRST: daftar kota yang mempunyai cache tersimpan
  const [kotaTersimpan, setKotaTersimpan] = useState<RingkasanKotaTersimpan[]>([]);

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);

  // latihan 3 modul 6
  const [daftarFavorit, setDaftarFavorit] = useState<{ id: number }[]>([]);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0); // pencegah race condition

  // TAMBAHAN OFFLINE-FIRST: memuat daftar kota yang cache-nya tersedia
  async function muatKotaTersimpan() {
    try {
      const daftar = await daftarKotaTersimpan();
      setKotaTersimpan(daftar);
    } catch {
      // Gagal membaca daftar cache tidak menghentikan aplikasi
    }
  }

  // TAMBAHAN OFFLINE-FIRST: membersihkan cache yang sudah melewati batas waktu
  // Saat aplikasi dibuka: buang cache > 7 hari, lalu tampilkan daftar tersimpan
  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .then(() => muatKotaTersimpan())
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }

    // TAMBAHAN OFFLINE-FIRST: mencegah hasil pencarian lama menimpa hasil terbaru
    let aktif = true;

    cariKota(teksTertunda)
      .then((daftar) => {
        if (aktif) setHasilPencarian(daftar);
      })
      .catch(() => {
        if (aktif) setHasilPencarian([]);
      });

    // TAMBAHAN OFFLINE-FIRST: membatalkan pembaruan state dari pencarian sebelumnya
    return () => {
      aktif = false;
    };
  }, [teksTertunda]);

  // latihan 3 modul 6
  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit()
        .then(setDaftarFavorit)
        .catch(() => {});
    }, []),
  );

  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some((kota) => kota.id === kotaTerpilih.id);

  // TAMBAHAN OFFLINE-FIRST: parameter paksaPerbarui digunakan untuk memaksa pengambilan data baru
  async function pilihKota(
    kota: HasilGeocoding,
    paksaPerbarui = false,
  ) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);

    // TAMBAHAN OFFLINE-FIRST: menghapus pesan lokasi sebelumnya saat kota dipilih
    setPesanLokasi(null);

    try {
      // TAMBAHAN OFFLINE-FIRST: menggunakan cache terlebih dahulu sesuai repository
      const data = await ambilCuacaOfflineFirst(
        {
          id: kota.id,
          nama: kota.name,
          latitude: kota.latitude,
          longitude: kota.longitude,
        },
        { paksaPerbarui },
      );

      if (idSaatIni !== requestIdRef.current) return; // hasil basi, abaikan

      // TAMBAHAN OFFLINE-FIRST: menyimpan hasil cuaca dan kualitas udara
      setHasil(data);

      // TAMBAHAN OFFLINE-FIRST: memperbarui daftar cache setelah pengambilan data
      await muatKotaTersimpan();
    } catch (err) {
      if (idSaatIni !== requestIdRef.current) return;

      // TAMBAHAN OFFLINE-FIRST: menampilkan pesan ketika data cache dan internet tidak tersedia
      setHasil(null);
      setPesanError(
        "Belum ada data tersimpan dan tidak ada koneksi internet. " +
          "Sambungkan internet lalu coba lagi.",
      );
    } finally {
      if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
    }
  }

  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();

    if (status === "denied") {
      setPesanLokasi(
        "Izin lokasi ditolak. Silakan cari kota secara manual di atas.",
      );
      return;
    }

    if (status === "unavailable") {
      setPesanLokasi(
        "Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.",
      );
      return;
    }

    setPesanLokasi(null);

    try {
      const koordinat = await ambilKoordinatSaatIni();

      // TAMBAHAN OFFLINE-FIRST: lokasi saat ini juga menggunakan repository cache-first
      await pilihKota({
        id: -1,
        name: "Lokasi Saat Ini",
        latitude: koordinat.latitude,
        longitude: koordinat.longitude,
        country: "",
      });
    } catch {
      // TAMBAHAN OFFLINE-FIRST: menangani kegagalan mendapatkan koordinat perangkat
      setPesanLokasi(
        "Lokasi tidak berhasil diperoleh. Silakan cari kota secara manual.",
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* TAMBAHAN OFFLINE-FIRST: ScrollView agar seluruh informasi bisa digulir */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox onCari={setTeksCari} />

        <Button title="Gunakan Lokasi Saat Ini" onPress={gunakanLokasiSaatIni} />

        {pesanLokasi && <Text>{pesanLokasi}</Text>}

        {hasilPencarian.map((kota) => (
          <TouchableOpacity key={kota.id} onPress={() => pilihKota(kota)}>
            <Text>{kota.name}</Text>
          </TouchableOpacity>
        ))}

        {/* TAMBAHAN OFFLINE-FIRST: menampilkan jumlah kota yang memiliki cache */}
        <Text style={{ fontSize: 12, color: "#777777" }}>
          Tersimpan {kotaTersimpan.length} kota
        </Text>

        {sedangMemuat && <ActivityIndicator />}

        {pesanError && (
          <View>
            <Text accessibilityLabel={pesanError}>{pesanError}</Text>
            <Button
              title="Coba Lagi"
              // TAMBAHAN OFFLINE-FIRST: mencoba kembali dengan memaksa pembaruan
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
            />
          </View>
        )}

        {/* TAMBAHAN OFFLINE-FIRST: status data cache atau online */}
        {hasil && kotaTerpilih && !sedangMemuat && (
          <>
            <StatusData
              sumber={hasil.sumber}
              disimpanPada={hasil.disimpanPada}
            />

            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(
                hasil.kualitasUdara.indeksAQI,
              )}
              indeksAQI={hasil.kualitasUdara.indeksAQI}
            />

            {/* Latihan Mandiri 1 Modul 5 */}
            <Text>
              Suhu maksimal: {hasil.cuaca.harian.suhuMaksimal[0]}°C
            </Text>

            <Text>
              Suhu minimal: {hasil.cuaca.harian.suhuMinimal[0]}°C
            </Text>

            <Text style={{ fontSize: 12, color: "#888" }}>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} • Angin{" "}
              {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>

            {/* Latihan Mandiri 2 Modul 5 */}
            <Text style={{ fontSize: 12, marginTop: 4 }}>
              PM2.5: {hasil.kualitasUdara.pm25} | PM10:{" "}
              {hasil.kualitasUdara.pm10}
            </Text>

            {/* TAMBAHAN OFFLINE-FIRST: tombol memperbarui data dari sumber online */}
            <Button
              title="Perbarui Sekarang"
              onPress={() => pilihKota(kotaTerpilih, true)}
            />

            {/* Fitur lama: tombol favorit dengan status sudah ditambahkan */}
            <TouchableOpacity
              disabled={sudahFavorit}
              onPress={() =>
                router.push({
                  pathname: "/tambah-favorit",
                  params: {
                    id: String(kotaTerpilih.id),
                    nama: kotaTerpilih.name,
                    lat: String(kotaTerpilih.latitude),
                    lon: String(kotaTerpilih.longitude),
                  },
                })
              }
              style={{
                backgroundColor: sudahFavorit ? "#BDBDBD" : "#2196F3",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 4,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {sudahFavorit ? "Sudah di Favorit" : "Tambahkan ke Favorit"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
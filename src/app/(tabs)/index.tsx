// src/app/(tabs)/index.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Button,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import StatusData from "../../components/StatusData";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";

import {
  ambilCuacaOfflineFirst,
  BATAS_CACHE_MS,
} from "../../services/cuacaRepository";

import {
  bersihkanCacheLama,
  daftarKotaTersimpan
} from "../../services/cacheRepository";

import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
// UTS - Fitur 2
import { simpanRiwayat } from "../../services/riwayatStorage";

import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";

import { HasilCuacaOffline, RingkasanKotaTersimpan } from "../../types/cache";

// UTS - Fitur 4
import { useTema } from "../../context/ThemeContext";

export default function HalamanUtama() {
  // UTS - Fitur 4
  const { warna } = useTema();

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);

  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);

  const [kotaTersimpan, setKotaTersimpan] = useState<RingkasanKotaTersimpan[]>(
    [],
  );

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);

  // latihan 3 modul 6
  const [daftarFavorit, setDaftarFavorit] = useState<{ id: number }[]>([]);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  // UTS - Fitur 2
  const params = useLocalSearchParams<{
    riwayatId?: string;
    nama?: string;
    lat?: string;
    lon?: string;
    negara?: string;
  }>();
  const riwayatDiprosesRef = useRef<string | null>(null);

  async function muatKotaTersimpan() {
    try {
      const daftar = await daftarKotaTersimpan();
      setKotaTersimpan(daftar);
    } catch {}
  }

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

    let aktif = true;

    cariKota(teksTertunda)
      .then((daftar) => {
        if (aktif) setHasilPencarian(daftar);
      })
      .catch(() => {
        if (aktif) setHasilPencarian([]);
      });

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

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    setPesanLokasi(null);

    try {
      const data = await ambilCuacaOfflineFirst(
        {
          id: kota.id,
          nama: kota.name,
          latitude: kota.latitude,
          longitude: kota.longitude,
        },
        { paksaPerbarui },
      );

      if (idSaatIni !== requestIdRef.current) return;

      setHasil(data);
      // UTS - Fitur 2 :
      if (kota.id !== -1) {
        try {
          await simpanRiwayat(kota);
        } catch (err) {
          console.error("Gagal menyimpan riwayat pencarian:", err);
        }
      }

      await muatKotaTersimpan();
    } catch (err) {
      if (idSaatIni !== requestIdRef.current) return;

      setHasil(null);
      setPesanError(
        "Belum ada data tersimpan dan tidak ada koneksi internet. " +
          "Sambungkan internet lalu coba lagi.",
      );
    } finally {
      if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
    }
  }

  // UTS - Fitur 2
  useEffect(() => {
    const { riwayatId, nama, lat, lon, negara } = params;

    if (!riwayatId || !nama || !lat || !lon) return;

    const kunci = `${riwayatId}-${nama}-${lat}-${lon}`;

    if (riwayatDiprosesRef.current === kunci) return;

    const latitude = Number(lat);
    const longitude = Number(lon);
    const id = Number(riwayatId);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(id)
    ) {
      return;
    }

    riwayatDiprosesRef.current = kunci;

    const kota: HasilGeocoding = {
      id,
      name: nama,
      latitude,
      longitude,
      country: negara ?? "",
    };

    setTeksCari(nama);
    pilihKota(kota);
  }, [params.riwayatId, params.nama, params.lat, params.lon, params.negara]);

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
      await pilihKota({
        id: -1,
        name: "Lokasi Saat Ini",
        latitude: koordinat.latitude,
        longitude: koordinat.longitude,
        country: "",
      });
    } catch {
      setPesanLokasi(
        "Lokasi tidak berhasil diperoleh. Silakan cari kota secara manual.",
      );
    }
  }

  return (
    // UTS - Fitur 4
    <SafeAreaView style={{ flex: 1, backgroundColor: warna.latar }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBox onCari={setTeksCari} />

        <Button
          title="Gunakan Lokasi Saat Ini"
          onPress={gunakanLokasiSaatIni}
        />

        {/* UTS - Fitur 4 */}
        {pesanLokasi && (
          <Text style={{ color: warna.teks }}>{pesanLokasi}</Text>
        )}

        {hasilPencarian.map((kota) => (
          <TouchableOpacity key={kota.id} onPress={() => pilihKota(kota)}>
            {/* UTS - Fitur 4 */}
            <Text style={{ color: warna.teks }}>{kota.name}</Text>
          </TouchableOpacity>
        ))}

        {/* UTS - Fitur 4 */}
        <Text style={{ fontSize: 12, color: warna.teksPudar }}> Tersimpan {kotaTersimpan.length} kota </Text>
    
        {/* UTS - Fitur 4 */}
        {sedangMemuat && <ActivityIndicator color={warna.aksen} />}

        {pesanError && (
          <View>
            {/* UTS - Fitur 4 */}
            <Text accessibilityLabel={pesanError} style={{ color: warna.teks }}>
              {pesanError}
            </Text>
            <Button
              title="Coba Lagi"
              // TAMBAHAN OFFLINE-FIRST: mencoba kembali dengan memaksa pembaruan
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
            />
          </View>
        )}

        {hasil && kotaTerpilih && !sedangMemuat && (
          <>
            <StatusData
              sumber={hasil.sumber}
              disimpanPada={hasil.disimpanPada}
            />

            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(hasil.kualitasUdara.indeksAQI)}
              indeksAQI={hasil.kualitasUdara.indeksAQI}
            />

            {/* Latihan Mandiri 1 Modul 5 */}
            {/* UTS - Fitur 4 */}
            <Text style={{ color: warna.teks }}>
              Suhu maksimal: {hasil.cuaca.harian.suhuMaksimal[0]}°C
            </Text>

            {/* UTS - Fitur 4 */}
            <Text style={{ color: warna.teks }}>
              Suhu minimal: {hasil.cuaca.harian.suhuMinimal[0]}°C
            </Text>

            {/* UTS - Fitur 4 */}
            <Text style={{ fontSize: 12, color: warna.teksPudar }}>
              Kondisi: {labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)} • Angin{" "}
              {hasil.cuaca.saatIni.kecepatanAngin} km/j
            </Text>

            {/* Latihan Mandiri 2 Modul 5 */}
            {/* UTS - Fitur 4 */}
            <Text style={{ fontSize: 12, marginTop: 4, color: warna.teks }}>
              PM2.5: {hasil.kualitasUdara.pm25} | PM10:{" "}
              {hasil.kualitasUdara.pm10}
            </Text>

            <Button
              title="Perbarui Sekarang"
              onPress={() => pilihKota(kotaTerpilih, true)}
            />

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
                // UTS - Fitur 4
                backgroundColor: sudahFavorit ? "#BDBDBD" : warna.aksen,
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
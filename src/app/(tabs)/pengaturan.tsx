import { useState } from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hapusSemuaCache } from "../../services/cacheRepository";
// UTS - Fitur 4
import { useTema, type ModeTema } from "../../context/ThemeContext";

export default function TabPengaturan() {
  const [pesan, setPesan] = useState<string | null>(null);
  // UTS - Fitur 4
  const { mode, gelap, warna, ubahMode } = useTema();

  async function hapusDataTersimpan() {
    try {
      await hapusSemuaCache();
      setPesan("Data cuaca tersimpan sudah dihapus.");
    } catch (error) {
      console.error("Gagal menghapus cache:", error);
      setPesan("Gagal menghapus data cuaca tersimpan.");
    }
  }

  // UTS - fitur 4
  function pilihTema(tema: ModeTema) {
    ubahMode(tema);
    setPesan(
      tema === "terang"
        ? "Mode Terang dipilih."
        : tema === "gelap"
          ? "Mode Gelap dipilih."
          : "Tema mengikuti pengaturan perangkat.",
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
        // UTS - fitur 4
        backgroundColor: warna.latar,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          // UTS - fitur 4
          color: warna.teks,
        }}
      >
        Pengaturan
      </Text>

      <Text style={{ color: warna.teks }}>Jelajah Aman</Text>

      {/* DIUBAH: warna.textSecondary -> warna.teksPudar */}
      <Text style={{ color: warna.teksPudar }}>Versi 1.0.0</Text>

      <View
        style={{
          padding: 16,
          gap: 12,
          borderRadius: 12,
          // DIUBAH: warna.backgroundElement -> warna.kartu
          backgroundColor: warna.kartu,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: warna.teks,
          }}
        >
          Tema Tampilan
        </Text>

        <Text style={{ color: warna.teksPudar }}>
          Pilih tampilan aplikasi yang kamu inginkan.
        </Text>

        {/* DIUBAH: nilai "light" -> "terang", warna tombol aktif -> warna.aksen */}
        <Button
          title={`${mode === "terang" ? "✓ " : ""}Terang`}
          onPress={() => pilihTema("terang")}
          color={mode === "terang" ? warna.aksen : "#6B7280"}
        />

        {/* DIUBAH: nilai "dark" -> "gelap" */}
        <Button
          title={`${mode === "gelap" ? "✓ " : ""}Gelap`}
          onPress={() => pilihTema("gelap")}
          color={mode === "gelap" ? warna.aksen : "#6B7280"}
        />

        {/* DIUBAH: nilai "system" -> "sistem", sekarang berubah warna saat dipilih */}
        <Button
          title={`${mode === "sistem" ? "✓ " : ""}Ikuti Sistem`}
          onPress={() => pilihTema("sistem")}
          color={mode === "sistem" ? warna.aksen : "#6B7280"}
        />

        {/* DIUBAH: temaAktif === "dark" -> gelap */}
        <Text style={{ color: warna.teksPudar }}>
          Tema aktif: {gelap ? "Gelap" : "Terang"}
        </Text>
      </View>

      <View
        style={{
          padding: 16,
          gap: 12,
          borderRadius: 12,
          backgroundColor: warna.kartu,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: warna.teks,
          }}
        >
          Penyimpanan
        </Text>

        <Button
          title="Hapus Data Cuaca Tersimpan"
          onPress={() => void hapusDataTersimpan()}
          color={warna.bahaya}
        />
      </View>

      {pesan && (
        <Text accessibilityLabel={pesan} style={{ color: warna.teks }}>
          {pesan}
        </Text>
      )}
    </SafeAreaView>
  );
}
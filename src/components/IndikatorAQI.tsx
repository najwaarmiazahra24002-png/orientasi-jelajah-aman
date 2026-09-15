import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LaporanUdara, TingkatAQI } from "../../types/cuaca";

interface IndikatorAQIProps {
  data: LaporanUdara;
}

const warnaTingkat: Record<TingkatAQI, string> = {
  BAIK: "#22c55e",         // hijau
  SEDANG: "#eab308",       // kuning
  TIDAK_SEHAT: "#f97316",  // oranye
  BERBAHAYA: "#ef4444",    // merah
};

const labelTingkat: Record<TingkatAQI, string> = {
  BAIK: "Baik",
  SEDANG: "Sedang",
  TIDAK_SEHAT: "Tidak Sehat",
  BERBAHAYA: "Berbahaya",
};

export default function IndikatorAQI({ data }: IndikatorAQIProps) {
  const warna = warnaTingkat[data.tingkat];

  return (
    <View style={[styles.container, { borderColor: warna }]}>
      <Text style={styles.kota}>{data.kota}</Text>
      <Text style={[styles.aqi, { color: warna }]}>
        AQI: {data.indeksAQI}
      </Text>
      <Text style={[styles.tingkat, { color: warna }]}>
        {labelTingkat[data.tingkat]}
      </Text>
      {data.diperbaruiPada && (
        <Text style={styles.waktu}>Diperbarui: {data.diperbaruiPada}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  kota: {
    fontSize: 16,
    fontWeight: "600",
  },
  aqi: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  tingkat: {
    fontSize: 14,
    fontWeight: "700",
  },
  waktu: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
});
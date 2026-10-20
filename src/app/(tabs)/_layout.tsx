// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
// UTS - Fitur 1
import { Ionicons } from "@expo/vector-icons";
// UTS - Fitur 4
import { useTema } from "../../context/ThemeContext";

export default function TabLayout() {
  // UTS - Fitur 4
  const { warna } = useTema();

  return (
    //tampilkan header, warna ikon + label saat aktif, warna + ikon saaat tidak aktif
    <Tabs
      screenOptions={{
        headerShown: true,
        // UTS - Fitur 4: warna header dan tab bar mengikuti tema
        headerStyle: { backgroundColor: warna.kartu },
        headerTitleStyle: { color: warna.teks },
        tabBarStyle: {
          backgroundColor: warna.kartu,
          borderTopColor: warna.garis,
        },
        // DIUBAH: dari "#2563EB" dan "#6B7280" menjadi warna tema
        tabBarActiveTintColor: warna.aksen,
        tabBarInactiveTintColor: warna.teksPudar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: "Riwayat & Favorit",
          tabBarLabel: "Riwayat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pengaturan"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tentang"
        options={{
          title: "Tentang",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
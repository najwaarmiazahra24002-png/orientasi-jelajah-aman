// app/_layout.tsx (root layout)
import { Stack } from "expo-router";
// UTS - Fitur 4
import { TemaProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    // UTS - Fitur 4: semua layar di dalam Stack bisa memakai useTema()
    <TemaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="detail/[kota]"
          options={{ title: "Detail Cuaca" }}
        />
        <Stack.Screen
          name="tambah-favorit"
          options={{ presentation: "modal", title: "Tambah Favorit" }}
        />
      </Stack>
    </TemaProvider>
  );
}
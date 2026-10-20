import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typeScale, spacing } from "../../constants/styles";
// UTS - Fitur 4
import { useTema } from "../../context/ThemeContext";

export default function Tentang() {
    // UTS - Fitur 4
    const { warna } = useTema();

    return (
        // UTS - Fitur 4
        <SafeAreaView style={{ flex: 1, backgroundColor: warna.latar }}>
            <View style={{ padding: spacing.besar }}>
                <Text
                    accessibilityLabel="Judul halaman Tentang"
                    style={{
                        fontSize: typeScale.judul,
                        fontWeight: "bold",
                        marginBottom: spacing.sedang,
                        // UTS - Fitur 4
                        color: warna.teks,
                    }}
                >
                    Tentang Jelajah Aman
                </Text>

                {/* UTS - Fitur 4 */}
                <Text style={{ fontSize: typeScale.isi, color: warna.teks }}>
                    Nama Aplikasi: Jelajah Aman
                </Text>

                <Text
                    style={{
                        fontSize: typeScale.isi,
                        marginTop: spacing.kecil,
                        // UTS - Fitur 4
                        color: warna.teks,
                    }}
                >
                    Versi: 1.0.0
                </Text>

                <Text
                    style={{
                        fontSize: typeScale.isi,
                        marginTop: spacing.kecil,
                        // UTS - Fitur 4
                        color: warna.teks,
                    }}
                >
                    Pembuat: Najwa Armia Zahra
                </Text>
            </View>
        </SafeAreaView>
    );
}
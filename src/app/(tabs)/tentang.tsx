import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typeScale, spacing } from "../../constants/styles";

export default function Tentang() {
    return (
        <SafeAreaView>
            <View style={{ padding: spacing.besar }}>
                <Text
                    accessibilityLabel="Judul halaman Tentang"
                    style={{
                        fontSize: typeScale.judul,
                        fontWeight: "bold",
                        marginBottom: spacing.sedang,
                    }}
                >
                    Tentang Jelajah Aman
                </Text>

                <Text style={{ fontSize: typeScale.isi }}>
                    Nama Aplikasi: Jelajah Aman
                </Text>

                <Text
                    style={{
                        fontSize: typeScale.isi,
                        marginTop: spacing.kecil,
                    }}
                >
                    Versi: 1.0.0
                </Text>

                <Text
                    style={{
                        fontSize: typeScale.isi,
                        marginTop: spacing.kecil,
                    }}
                >
                    Pembuat: Najwa Armia Zahra
                </Text>
            </View>
        </SafeAreaView>
    );
}
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function QRCheckin() {
  const pulse = useRef(new Animated.Value(1)).current;
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleSimulateScan = () => {
    setScanned(true);
    setTimeout(() => setScanned(false), 2500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      {/* Header */}
      <LinearGradient
        colors={["rgba(255,104,44,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>QR Check-in</Text>
        </View>
      </LinearGradient>

      {/* Scanner area */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: 32 }}>
          <View
            style={{
              width: 240,
              height: 240,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: scanned ? "#48bb78" : "#ff682c",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: scanned ? "rgba(72,187,120,0.08)" : "rgba(255,104,44,0.06)",
            }}
          >
            {/* Corner markers */}
            {[
              { top: -2, left: -2 }, { top: -2, right: -2 },
              { bottom: -2, left: -2 }, { bottom: -2, right: -2 },
            ].map((pos, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderColor: scanned ? "#48bb78" : "#ff682c",
                  borderTopWidth: i < 2 ? 3 : 0,
                  borderBottomWidth: i >= 2 ? 3 : 0,
                  borderLeftWidth: i % 2 === 0 ? 3 : 0,
                  borderRightWidth: i % 2 !== 0 ? 3 : 0,
                  ...pos,
                }}
              />
            ))}
            <MaterialCommunityIcons
              name={scanned ? "check-circle" : "qrcode-scan"}
              size={80}
              color={scanned ? "#48bb78" : "#ff682c"}
            />
          </View>
        </Animated.View>

        {scanned ? (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#48bb78", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>
              ✓ Check-in thành công!
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>MSKU1234567 · Cổng A</Text>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600", marginBottom: 8 }}>
              Đưa mã QR vào khung
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
              Hướng camera vào mã QR trên phiếu vào cổng để quét tự động
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSimulateScan}
          style={{
            marginTop: 40,
            paddingHorizontal: 28,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: "#ff682c",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Mô phỏng quét QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

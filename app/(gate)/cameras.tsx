import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const CAMERAS = [
  { id: "CAM-01", name: "Cổng A - Vào", location: "Cổng chính phía Bắc", status: "online" },
  { id: "CAM-02", name: "Cổng A - Ra", location: "Cổng chính phía Bắc", status: "online" },
  { id: "CAM-03", name: "Cổng B - Vào", location: "Cổng phụ phía Nam", status: "online" },
  { id: "CAM-04", name: "Cổng B - Ra", location: "Cổng phụ phía Nam", status: "offline" },
  { id: "CAM-05", name: "Khu vực đợi", location: "Sân chờ xe", status: "online" },
];

export default function GateCameras() {
  return (
    <View style={{ flex: 1, backgroundColor: "#080808" }}>
      <LinearGradient
        colors={["rgba(99,179,237,0.12)", "transparent"]}
        style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" }}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>Camera cổng</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, borderRadius: 14, padding: 12, alignItems: "center", backgroundColor: "rgba(72,187,120,0.08)", borderWidth: 1, borderColor: "rgba(72,187,120,0.2)" }}>
            <Text style={{ color: "#48bb78", fontWeight: "700", fontSize: 22 }}>4</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Trực tuyến</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 14, padding: 12, alignItems: "center", backgroundColor: "rgba(252,91,91,0.08)", borderWidth: 1, borderColor: "rgba(252,91,91,0.2)" }}>
            <Text style={{ color: "#fc5b5b", fontWeight: "700", fontSize: 22 }}>1</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Ngoại tuyến</Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          {CAMERAS.map(cam => (
            <TouchableOpacity
              key={cam.id}
              style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}
            >
              {/* Camera preview placeholder */}
              <View style={{ height: 140, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" }}>
                {cam.status === "online" ? (
                  <>
                    <MaterialCommunityIcons name="cctv" size={36} color="rgba(99,179,237,0.6)" />
                    <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 8 }}>Luồng trực tiếp đang hoạt động</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="cctv-off" size={36} color="rgba(252,91,91,0.5)" />
                    <Text style={{ color: "rgba(252,91,91,0.6)", fontSize: 12, marginTop: 8 }}>Camera không kết nối được</Text>
                  </>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>{cam.name}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{cam.id} · {cam.location}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cam.status === "online" ? "#48bb78" : "#fc5b5b" }} />
                  <Text style={{ fontSize: 12, color: cam.status === "online" ? "#48bb78" : "#fc5b5b" }}>
                    {cam.status === "online" ? "Trực tuyến" : "Ngoại tuyến"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const DEFAULT_BASE = Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("tiendriver");
  const [password, setPassword] = useState("NexusPort@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cấu hình URL máy chủ backend
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_BASE);
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempBaseUrl, setTempBaseUrl] = useState(DEFAULT_BASE);
  const [serverTesting, setServerTesting] = useState(false);
  const [serverStatusMsg, setServerStatusMsg] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("api_base_url").then((saved) => {
      if (saved) {
        setApiBaseUrl(saved);
        setTempBaseUrl(saved);
      }
    });
  }, []);

  const testServerConnection = async () => {
    setServerTesting(true);
    setServerStatusMsg("");
    try {
      const url = tempBaseUrl.replace(/\/$/, "");
      const res = await fetch(`${url}/api/health`, { method: "GET" });
      if (res.ok) {
        setServerStatusMsg("✅ Kết nối máy chủ thành công!");
      } else {
        setServerStatusMsg(`⚠️ Máy chủ phản hồi mã lỗi HTTP ${res.status}`);
      }
    } catch (err: any) {
      setServerStatusMsg("❌ Không thể kết nối đến máy chủ: " + (err.message || "Network request failed"));
    } finally {
      setServerTesting(false);
    }
  };

  const saveServerUrl = async () => {
    const cleanUrl = tempBaseUrl.trim().replace(/\/$/, "");
    setApiBaseUrl(cleanUrl);
    await AsyncStorage.setItem("api_base_url", cleanUrl);
    setShowServerModal(false);
  };

  /**
   * Đăng nhập thật kết nối trực tiếp đến Backend API
   * Mặc định vai trò Driver (ứng dụng chuyên biệt cho Tài xế)
   */
  const handleLogin = async (userToSubmit?: string, passToSubmit?: string) => {
    if (loading) return;
    const finalUser = (userToSubmit || username).trim();
    const finalPass = (passToSubmit || password).trim();

    if (!finalUser || !finalPass) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await signIn(finalUser, finalPass, "Driver");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-carbon"
      style={{ backgroundColor: "#0b1319" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(255,104,44,0.15)", "transparent", "rgba(29,108,86,0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nút cài đặt Server IP ở góc trên */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowServerModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <Ionicons name="server-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>Máy chủ API</Text>
          </TouchableOpacity>
        </View>

        {/* Logo & Header */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: "#ff682c",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#ff682c",
              shadowOpacity: 0.5,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <MaterialCommunityIcons name="truck-fast" size={32} color="white" />
          </View>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
            NexusPort<Text style={{ color: "#ff682c" }}>.</Text> Driver
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 20 }}>
            Ứng dụng di động chuyên biệt dành cho Tài xế xe vận chuyển container
          </Text>
        </View>

        {/* Card Form */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: 22,
          }}
        >
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Đăng nhập Tài xế</Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4 }}>
              Nhập tài khoản được cấp bởi công ty vận tải hoặc điều độ cảng
            </Text>
          </View>

          {/* Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Tên đăng nhập
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                paddingHorizontal: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                height: 50,
              }}
            >
              <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={{ flex: 1, color: "white", fontSize: 14, marginLeft: 10 }}
                placeholder="tiendriver hoặc driver01..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Mật khẩu
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                paddingHorizontal: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                height: 50,
              }}
            >
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={{ flex: 1, color: "white", fontSize: 14, marginLeft: 10 }}
                placeholder="••••••••••••"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.45)"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error message */}
          {error ? (
            <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginVertical: 10 }}>
              <Text style={{ color: "#f87171", fontSize: 12, lineHeight: 18 }}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Server endpoint hint */}
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 4, marginBottom: 18 }}>
            Máy chủ API: <Text style={{ color: "rgba(255,255,255,0.6)" }}>{apiBaseUrl}</Text>
          </Text>

          {/* Login button */}
          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={loading}
            style={{
              backgroundColor: "#ff682c",
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: loading ? 0.7 : 1,
              shadowColor: "#ff682c",
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Đăng nhập vào hệ thống</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Quick demo accounts */}
          <View style={{ marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" }}>
              Tài khoản mẫu tài xế:
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => fillQuickAccount("tiendriver", "NexusPort@2026")}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,104,44,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(255,104,44,0.3)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ff824c", fontSize: 12, fontWeight: "700" }}>tiendriver</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>N.Đ.Tiến (Đã gán xe)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillQuickAccount("driver01", "NexusPort@2026")}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>driver01</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>Tài xế mặc định</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notice for other roles */}
        <View style={{ marginTop: 24, padding: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            Nhân viên Cổng (Gate), Điều độ bãi (Yard) và Quản trị viên vui lòng sử dụng <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>Cổng thông tin Web</Text> để thực hiện nghiệp vụ.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Cấu hình URL Máy chủ API */}
      <Modal visible={showServerModal} transparent animationType="fade" onRequestClose={() => setShowServerModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", maxWidth: 360, backgroundColor: "#17232d", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", padding: 20, gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="server" size={22} color="#ff682c" />
              <Text style={{ color: "white", fontSize: 17, fontWeight: "bold" }}>Cài đặt máy chủ API</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 18 }}>
              Khi kiểm thử trên thiết bị thật, hãy điền IP mạng LAN của máy tính đang chạy backend (ví dụ: http://192.168.1.50:3001).
            </Text>

            <TextInput
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "white",
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
              }}
              value={tempBaseUrl}
              onChangeText={setTempBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://localhost:3001"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            {serverStatusMsg ? (
              <Text style={{ fontSize: 12, color: serverStatusMsg.startsWith("✅") ? "#4ade80" : "#f87171" }}>
                {serverStatusMsg}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={testServerConnection}
                disabled={serverTesting}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                }}
              >
                {serverTesting ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Kiểm tra</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveServerUrl}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  backgroundColor: "#ff682c",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>Lưu lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

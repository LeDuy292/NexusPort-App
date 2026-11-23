import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Đăng nhập thật kết nối trực tiếp đến Backend API
   * Mặc định vai trò Driver (ứng dụng chuyên biệt cho Tài xế)
   */
  const handleLogin = async () => {
    if (loading) return;
    const finalUser = username.trim();
    const finalPass = password;

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-carbon"
      style={{ backgroundColor: "#080a0f" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background gradient & Ambient orange glow */}
      <LinearGradient
        colors={["rgba(255,104,44,0.2)", "rgba(11,16,24,0.8)", "#080a0f"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              backgroundColor: "#ff682c",
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: "#ff682c",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <MaterialCommunityIcons name="truck-fast" size={38} color="white" />
          </View>
          <Text style={{ color: "#ffffff", fontSize: 30, fontWeight: "900", letterSpacing: -0.5 }}>
            NexusPort<Text style={{ color: "#ff682c" }}>.</Text> <Text style={{ color: "#94a3b8", fontSize: 20, fontWeight: "700" }}>Driver</Text>
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 20, lineHeight: 18 }}>
            Ứng dụng di động chuyên biệt dành cho Tài xế xe vận chuyển container
          </Text>
        </View>

        {/* Card Form */}
        <View
          style={{
            backgroundColor: "rgba(17, 21, 30, 0.85)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "800", letterSpacing: -0.2 }}>Đăng nhập Tài xế</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>
              Nhập tài khoản được cấp bởi công ty vận tải hoặc điều độ cảng
            </Text>
          </View>

          {/* Username */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Tên đăng nhập
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                paddingHorizontal: 14,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                height: 52,
              }}
            >
              <Ionicons name="person-outline" size={18} color="#ff682c" />
              <TextInput
                style={{ flex: 1, color: "white", fontSize: 14, marginLeft: 10 }}
                placeholder="Nhập tên đăng nhập hoặc email..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Mật khẩu
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                paddingHorizontal: 14,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                height: 52,
              }}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#ff682c" />
              <TextInput
                style={{ flex: 1, color: "white", fontSize: 14, marginLeft: 10 }}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error message */}
          {error ? (
            <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.35)", borderRadius: 12, padding: 12, marginVertical: 10 }}>
              <Text style={{ color: "#f87171", fontSize: 12, lineHeight: 18 }}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Login button */}
          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#ff682c",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              opacity: loading ? 0.7 : 1,
              shadowColor: "#ff682c",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.45,
              shadowRadius: 14,
              elevation: 6,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={{ color: "white", fontWeight: "800", fontSize: 15, letterSpacing: -0.2 }}>Đăng nhập vào hệ thống</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Notice for other roles */}
        <View style={{ marginTop: 24, padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center", lineHeight: 18 }}>
            Nhân viên Cổng (Gate), Điều độ bãi (Yard) và Quản trị viên vui lòng sử dụng <Text style={{ color: "#ff824c", fontWeight: "700" }}>Cổng thông tin Web</Text> để thực hiện nghiệp vụ.
          </Text>
        </View>
      </ScrollView>

    </KeyboardAvoidingView>
  );
}

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/features/auth/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const DEFAULT_BASE = Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

const ROLES = [
  {
    id: "driver",
    title: "Tài xế",
    subtitle: "Tài xế vận chuyển container",
    icon: "truck" as const,
    iconColor: "#ff682c",
    iconBg: "rgba(255,104,44,0.15)",
    roleName: "Driver",
    defaultUsername: "driver01",
  },
  {
    id: "gate",
    title: "Gate Officer",
    subtitle: "Kiểm soát viên cổng vào ra",
    icon: "shield-check" as const,
    iconColor: "#48bb78",
    iconBg: "rgba(72,187,120,0.12)",
    roleName: "Gate Officer",
    defaultUsername: "gate01",
  },
  {
    id: "yard",
    title: "Yard Operator",
    subtitle: "Nhân viên vận hành bãi container",
    icon: "forklift" as const,
    iconColor: "#f6ad55",
    iconBg: "rgba(246,173,85,0.12)",
    roleName: "Yard Operator",
    defaultUsername: "yard01",
  },
  {
    id: "berth",
    title: "Berth Staff",
    subtitle: "Nhân viên cầu tàu",
    icon: "anchor" as const,
    iconColor: "#63b3ed",
    iconBg: "rgba(99,179,237,0.12)",
    roleName: "Berth Staff",
    defaultUsername: "berth01",
  },
];


export default function LoginScreen() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<(typeof ROLES)[0] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSelectRole = (role: (typeof ROLES)[0]) => {
    setSelectedRole(role);
    setUsername(role.defaultUsername || "");
    setPassword("NexusPort@2026");
    setStep(2);
    setError("");
  };

  const getBase = async (): Promise<string> => {
    const saved = await AsyncStorage.getItem("api_base_url");
    return (saved || apiBaseUrl || DEFAULT_BASE).replace(/\/$/, "");
  };

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
   * Đăng nhập thật kết nối trực tiếp đến Backend API PostgreSQL
   */
  const handleLogin = async () => {
    if (loading || !selectedRole) return;
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await signIn(username, password, selectedRole.roleName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng nhập nhanh chế độ Demo
   */
  const handleDemoLogin = async () => {
    if (loading || !selectedRole) return;
    setLoading(true);
    setError("");
    try {
      await signIn(username.trim() || selectedRole.defaultUsername || "driver01", password.trim() || "NexusPort@2026", selectedRole.roleName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-carbon"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(255,104,44,0.12)", "transparent", "rgba(255,104,44,0.05)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Nút cài đặt Server IP ở góc trên */}
        <View className="flex-row justify-end mb-4">
          <TouchableOpacity
            onPress={() => setShowServerModal(true)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
          >
            <Ionicons name="server-outline" size={13} color="rgba(255,255,255,0.6)" />
            <Text className="text-white/60 text-xs font-medium">Máy chủ API</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View className="items-center mb-8">
          <View
            className="w-14 h-14 bg-signal rounded-2xl items-center justify-center mb-4 shadow-lg"
            style={{ shadowColor: "#ff682c", shadowOpacity: 0.4, shadowRadius: 16 }}
          >
            <MaterialCommunityIcons name="anchor" size={28} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">
            NexusPort<Text className="text-signal">.</Text>
          </Text>
          <Text className="text-white/40 text-xs font-medium mt-1 tracking-widest uppercase">
            Terminal Management System
          </Text>
        </View>

        {/* Card */}
        <View
          className="rounded-3xl p-6 overflow-hidden"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Step indicators */}
          <View className="flex-row items-center mb-6">
            <View className="flex-row items-center gap-2">
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: step === 1 ? "#ff682c" : "rgba(255,255,255,0.1)" }}
              >
                {step > 1 ? (
                  <Ionicons name="checkmark" size={14} color="white" />
                ) : (
                  <Text className="text-white text-xs font-bold">1</Text>
                )}
              </View>
              <Text className={`text-xs font-semibold ${step === 1 ? "text-signal" : "text-white/40"}`}>
                Chọn vai trò
              </Text>
            </View>
            <View className="flex-1 h-px bg-white/10 mx-3" />
            <View className="flex-row items-center gap-2">
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: step === 2 ? "#ff682c" : "transparent",
                  borderWidth: step === 2 ? 0 : 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Text className={`text-xs font-bold ${step === 2 ? "text-white" : "text-white/40"}`}>2</Text>
              </View>
              <Text className={`text-xs font-semibold ${step === 2 ? "text-signal" : "text-white/40"}`}>
                Đăng nhập
              </Text>
            </View>
          </View>

          {/* STEP 1: Role selection */}
          {step === 1 && (
            <View>
              <Text className="text-white text-xl font-bold mb-1">Xin chào! 👋</Text>
              <Text className="text-white/40 text-sm mb-5">
                Chọn vai trò của bạn để tiếp tục
              </Text>

              <View className="gap-3">
                {ROLES.map((role) => (
                  <Pressable
                    key={role.id}
                    onPress={() => handleSelectRole(role)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? "rgba(255,104,44,0.08)"
                        : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: pressed
                        ? "rgba(255,104,44,0.4)"
                        : "rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    })}
                  >
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: role.iconBg }}
                    >
                      <MaterialCommunityIcons
                        name={role.icon}
                        size={22}
                        color={role.iconColor}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-semibold">{role.title}</Text>
                      <Text className="text-white/40 text-xs mt-0.5">{role.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: Credentials */}
          {step === 2 && (
            <View>
              {/* Back + role badge */}
              <View className="flex-row items-center gap-3 mb-5">
                <TouchableOpacity
                  onPress={() => { setStep(1); setError(""); }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>

                <View
                  className="flex-row items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,104,44,0.1)", borderWidth: 1, borderColor: "rgba(255,104,44,0.25)" }}
                >
                  <MaterialCommunityIcons name={selectedRole!.icon} size={14} color="#ff682c" />
                  <Text className="text-signal text-xs font-semibold">{selectedRole!.title}</Text>
                </View>
              </View>

              <Text className="text-white text-xl font-bold mb-1">Xác thực tài khoản</Text>
              <Text className="text-white/40 text-sm mb-6">Kiểm tra thông tin đăng nhập với cơ sở dữ liệu cảng</Text>

              {/* Username */}
              <View className="mb-4">
                <Text className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2">
                  Tên đăng nhập hoặc Email
                </Text>
                <View
                  className="flex-row items-center rounded-xl px-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    height: 48,
                  }}
                >
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.25)" />
                  <TextInput
                    className="flex-1 text-white text-sm ml-3"
                    placeholder="driver01 hoặc email..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-2">
                <Text className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2">
                  Mật khẩu
                </Text>
                <View
                  className="flex-row items-center rounded-xl px-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    height: 48,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.25)" />
                  <TextInput
                    className="flex-1 text-white text-sm ml-3"
                    placeholder="••••••••••••"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="rgba(255,255,255,0.3)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error message */}
              {error ? (
                <View className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 mt-2 mb-3">
                  <Text className="text-red-400 text-xs leading-5">⚠️ {error}</Text>
                </View>
              ) : null}

              {/* Server endpoint hint */}
              <Text className="text-white/30 text-[11px] mb-4 mt-1">
                Kết nối đến: <Text className="text-white/50">{apiBaseUrl}</Text>
              </Text>

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="rounded-xl items-center justify-center py-4 mb-3"
                style={{
                  backgroundColor: loading ? "rgba(255,104,44,0.4)" : "#ff682c",
                  shadowColor: "#ff682c",
                  shadowOpacity: loading ? 0 : 0.35,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-sm">
                    Đăng nhập hệ thống (API thật)
                  </Text>
                )}
              </TouchableOpacity>

              {/* Chế độ Demo / Offline phòng khi máy chưa bật Backend */}
              <TouchableOpacity
                onPress={handleDemoLogin}
                disabled={loading}
                className="rounded-xl items-center justify-center py-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Text className="text-white/60 text-xs font-medium">
                  ⚡ Vào nhanh chế độ Demo (Offline)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text className="text-white/20 text-center text-[11px] mt-8">
          © 2026 NexusPort Inc. · Hệ thống Quản trị & Điều phối Cảng
        </Text>
      </ScrollView>

      {/* Modal Cấu hình URL Máy chủ API */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View className="flex-1 bg-black/75 justify-center items-center px-6">
          <View
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: "#18181b",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="settings-outline" size={20} color="#ff682c" />
                <Text className="text-white font-bold text-base">Cấu hình Máy chủ</Text>
              </View>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <Text className="text-white/60 text-xs mb-3">
              Nhập địa chỉ máy chủ Backend (Localhost hoặc IP máy tính khi test trên điện thoại thật):
            </Text>

            <View
              className="flex-row items-center rounded-xl px-4 mb-3"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
                height: 48,
              }}
            >
              <TextInput
                className="flex-1 text-white text-xs"
                placeholder="http://192.168.1.10:3001"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={tempBaseUrl}
                onChangeText={setTempBaseUrl}
                autoCapitalize="none"
              />
            </View>

            {/* Nút gợi ý nhanh */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              <TouchableOpacity
                onPress={() => setTempBaseUrl("http://localhost:3001")}
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Text className="text-white/60 text-[11px]">localhost:3001</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTempBaseUrl("http://10.0.2.2:3001")}
                className="px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <Text className="text-white/60 text-[11px]">10.0.2.2:3001 (Android)</Text>
              </TouchableOpacity>
            </View>

            {serverStatusMsg ? (
              <Text className="text-xs mb-3 font-medium" style={{ color: serverStatusMsg.startsWith("✅") ? "#48bb78" : "#fc5b5b" }}>
                {serverStatusMsg}
              </Text>
            ) : null}

            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={testServerConnection}
                disabled={serverTesting}
                className="flex-1 py-3 rounded-xl items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                {serverTesting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white text-xs font-semibold">Kiểm tra kết nối</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveServerUrl}
                className="flex-1 py-3 rounded-xl items-center justify-center bg-signal"
              >
                <Text className="text-white text-xs font-semibold">Lưu địa chỉ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

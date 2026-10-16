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
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const ROLES = [
  {
    id: "driver",
    title: "Tài xế",
    subtitle: "Tài xế vận chuyển container",
    icon: "truck" as const,
    iconColor: "#ff682c",
    iconBg: "rgba(255,104,44,0.15)",
    roleName: "Driver",
    redirect: "/(driver)",
  },
  {
    id: "gate",
    title: "Gate Officer",
    subtitle: "Kiểm soát viên cổng vào ra",
    icon: "shield-check" as const,
    iconColor: "#48bb78",
    iconBg: "rgba(72,187,120,0.12)",
    roleName: "Gate Officer",
    redirect: "/(gate)",
  },
  {
    id: "yard",
    title: "Yard Operator",
    subtitle: "Nhân viên vận hành bãi container",
    icon: "forklift" as const,
    iconColor: "#f6ad55",
    iconBg: "rgba(246,173,85,0.12)",
    roleName: "Yard Operator",
    redirect: "/(yard)",
  },
  {
    id: "berth",
    title: "Berth Staff",
    subtitle: "Nhân viên cầu tàu",
    icon: "anchor" as const,
    iconColor: "#63b3ed",
    iconBg: "rgba(99,179,237,0.12)",
    roleName: "Berth Staff",
    redirect: "/(yard)",
  },
];

export default function LoginScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<(typeof ROLES)[0] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectRole = (role: (typeof ROLES)[0]) => {
    setSelectedRole(role);
    setStep(2);
    setError("");
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((r) => setTimeout(r, 600));

      const user = {
        username,
        role: selectedRole!.roleName,
        redirect: selectedRole!.redirect,
      };

      await AsyncStorage.setItem("user", JSON.stringify(user));
      setLoading(false);
      router.replace(selectedRole!.redirect as any);
    } catch (err) {
      setLoading(false);
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
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
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-14 h-14 bg-signal rounded-2xl items-center justify-center mb-4 shadow-lg"
            style={{ shadowColor: "#ff682c", shadowOpacity: 0.4, shadowRadius: 16 }}>
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

              <Text className="text-white text-xl font-bold mb-1">Đăng nhập</Text>
              <Text className="text-white/40 text-sm mb-6">Nhập thông tin tài khoản của bạn</Text>

              {/* Username */}
              <View className="mb-4">
                <Text className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2">
                  Tên đăng nhập
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
                    placeholder="nguyen.van.a@nexusport.vn"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="email-address"
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
                <Text className="text-red-400 text-xs mt-1 mb-2">{error}</Text>
              ) : null}

              {/* Forgot password */}
              <TouchableOpacity className="self-end mb-6">
                <Text className="text-signal text-xs font-semibold">Quên mật khẩu?</Text>
              </TouchableOpacity>

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="rounded-xl items-center justify-center py-4"
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
                    Đăng nhập vào hệ thống
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text className="text-white/20 text-center text-[11px] mt-8">
          © 2026 NexusPort Inc. · Phiên bản 1.0.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

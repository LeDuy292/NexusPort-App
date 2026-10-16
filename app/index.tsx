import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((val) => {
        setIsLoggedIn(!!val);
      })
      .catch(() => {
        setIsLoggedIn(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <ActivityIndicator color="#ff682c" size="large" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? "/(driver)" : "/(auth)/login"} />;
}

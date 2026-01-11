import { Tabs, usePathname } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScreenOrientation } from "@/hooks/use-screen-orientation";

export default function TabLayout() {
  const { setScreenOrientationLock } = useScreenOrientation();
  const pathname = usePathname();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const lockOrientation = async () => {
      if (pathname === "/camera") {
        await setScreenOrientationLock(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
        );
      } else {
        await setScreenOrientationLock(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      }
    };

    lockOrientation();
  }, [pathname, setScreenOrientationLock]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="elevationMap"
        options={{
          title: "Elevation Map",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

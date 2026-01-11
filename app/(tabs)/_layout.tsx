import { Tabs, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { CustomTabLabel } from "@/components/tab-label";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const [screenOrientation, setScreenOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const pathname = usePathname();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (pathname === "/camera") {
      setScreenOrientation("landscape");
    } else {
      setScreenOrientation("portrait");
    }
  }, [pathname]);

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
          tabBarIconStyle: { display: "none" },
          tabBarLabel: ({ color }) => (
            <CustomTabLabel
              name="Home"
              color={color}
              rotated={screenOrientation === "landscape"}
              icon="house.fill"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIconStyle: { display: "none" },
          tabBarLabel: ({ color }) => (
            <CustomTabLabel
              name="Explore"
              color={color}
              rotated={screenOrientation === "landscape"}
              icon="paperplane.fill"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIconStyle: { display: "none" },
          tabBarLabel: ({ color }) => (
            <CustomTabLabel
              name="Camera"
              color={color}
              rotated={screenOrientation === "landscape"}
              icon="camera"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="elevationMap"
        options={{
          tabBarIconStyle: { display: "none" },
          tabBarLabel: ({ color }) => (
            <CustomTabLabel
              name="Map"
              color={color}
              rotated={screenOrientation === "landscape"}
              icon="map"
            />
          ),
        }}
      />
    </Tabs>
  );
}

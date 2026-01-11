import { SymbolViewProps } from "expo-symbols";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text } from "react-native";

import { IconSymbol } from "./ui/icon-symbol";

interface TabLabelProps {
  name: string;
  color: string;
  rotated: boolean;
  icon: SymbolViewProps["name"];
}

export function CustomTabLabel({ name, color, rotated, icon }: TabLabelProps) {
  const rotation = useRef(new Animated.Value(rotated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: rotated ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [rotation, rotated]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }],
        alignItems: "center",
      }}
    >
      <IconSymbol name={icon} size={28} color={color} />
      <Text style={{ color, fontSize: 12 }}>{name}</Text>
    </Animated.View>
  );
}

import { StyleSheet, Text, View } from "react-native";

interface PeakLabelProps {
  name: string;
  elevation: number;
  position: { x: number; y: number };
}

export function PeakLabel({ name, elevation, position }: PeakLabelProps) {
  return (
    <View
      style={[
        styles.pointMarker,
        {
          left: position.x,
          top: position.y,
        },
      ]}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{name}</Text>
        <Text style={styles.subText}>{Math.round(elevation)} m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pointMarker: {
    position: "absolute",
    justifyContent: "center",
    height: 32,
    transform: [{ translateY: -16 }, { rotate: "45deg" }],
    transformOrigin: "left center",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    backgroundColor: "white",
    borderRadius: 999,
    paddingLeft: 10,
    opacity: 0.8,
  },
  labelText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: 8,
  },
  subText: {
    height: "100%",
    backgroundColor: "#00ffff",
    color: "#2c2c2c",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopEndRadius: 999,
    borderBottomEndRadius: 999,
  },
});

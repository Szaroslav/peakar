import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNearbyPeaks } from "@/hooks/use-nearby-peaks";

const { width, height } = Dimensions.get("window");
const POINT_SIZE = 12;

export default function ElevationMap() {
  const { peaks, currentLocation, loading, error } = useNearbyPeaks();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white" }}>Loading points…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const normalize = (lat: number, lng: number) => {
    const scaling_factor = 5000;
    if (!currentLocation) return { x: 0, y: 0 };
    const dx = (lng - currentLocation.longitude) * scaling_factor;
    const dy = (lat - currentLocation.latitude) * scaling_factor;
    return { x: width / 2 + dx, y: height / 2 - dy };
  };

  return (
    <View style={styles.container}>
      {peaks.map((p, i) => {
        const { x, y } = normalize(p.latitude, p.longitude);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              alignItems: "center",
              opacity: p.isVisible ? 1.0 : 0.5,
            }}
          >
            <View
              style={[
                styles.point,
                { backgroundColor: p.isVisible ? "#3a71fb" : "#485066" },
              ]}
            />
            <Text style={styles.mapPointName}>{p.name}</Text>
            <Text style={styles.mapPointElevation}>
              {Math.round(p.elevation)} m
            </Text>
          </View>
        );
      })}

      {currentLocation && (
        <View
          style={{
            position: "absolute",
            left: width / 2,
            top: height / 2,
            alignItems: "center",
          }}
        >
          <View style={[styles.point, { backgroundColor: "green" }]} />
          <Text style={styles.mapPointName}>You</Text>
          {currentLocation.elevation !== undefined && (
            <Text style={styles.mapPointElevation}>
              {Math.round(currentLocation.elevation)} m
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  point: {
    width: POINT_SIZE,
    height: POINT_SIZE,
    borderRadius: POINT_SIZE / 2,
  },
  mapPointName: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  mapPointElevation: {
    color: "#ececec",
    fontSize: 12,
  },
});

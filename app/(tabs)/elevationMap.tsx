import { MapPoint } from "@/models/map";
import { getElevation, getElevations } from "@/services/elevationApi";
import { generate2dGrid } from "@/utils/generate2dGrid";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
const { width, height } = Dimensions.get("window");
const POINT_SIZE = 12;

export default function ElevationMap() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<MapPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        // Get current location
        const loc = await Location.getCurrentPositionAsync({});
        const current: MapPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          elevation: await getElevation(
            loc.coords.latitude,
            loc.coords.longitude,
          ),
          isVisible: true,
        };
        setCurrentLocation(current);
        console.log("Current location with elevation:", current);

        const coordGrid = generate2dGrid(
          { latitude: current.latitude, longitude: current.longitude },
          { size: 50000, density: 50 },
        );
        console.log("Grid of points:", coordGrid);

        // Fetch elevations
        const elevations = await getElevations(coordGrid);
        console.log("Elevation coords:", elevations);

        const mapPointGrid: MapPoint[] = elevations.map((e) => ({
          ...e,
          isVisible: true,
        }));
        setPoints(mapPointGrid);
      } catch (err: any) {
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    const scaling_factor = 10000;
    if (!currentLocation) return { x: 0, y: 0 };
    const dx = (lng - currentLocation.longitude) * scaling_factor;
    const dy = (lat - currentLocation.latitude) * scaling_factor;
    return { x: width / 2 + dx, y: height / 2 - dy };
  };

  return (
    <View style={styles.container}>
      {points.map((p, i) => {
        const { x, y } = normalize(p.latitude, p.longitude);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              alignItems: "center",
            }}
          >
            <View
              style={[
                styles.point,
                { backgroundColor: p.isVisible ? "green" : "orange" },
              ]}
            />
            <Text style={styles.elevationText}>
              {Math.round(p.elevation ?? -1)} m
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
          <View style={[styles.point, { backgroundColor: "red" }]} />
          {currentLocation.elevation !== undefined && (
            <Text style={styles.elevationText}>
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
  elevationText: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
});

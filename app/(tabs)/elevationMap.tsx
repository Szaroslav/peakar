import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import { getElevations, getElevation } from "@/services/elevationApi";

const { width, height } = Dimensions.get("window");
const POINT_SIZE = 12;

export default function ElevationMap() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<{ latitude: number; longitude: number; elevation: number }[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; elevation?: number } | null>(null);
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
        const current = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, elevation: 0 };
        current.elevation = await getElevation(current.latitude, current.longitude);
        setCurrentLocation(current);

        // Example other points around user
        const otherPointsCoords = [
          { latitude: loc.coords.latitude + 0.006, longitude: loc.coords.longitude + 0.001 },
          { latitude: loc.coords.latitude - 0.001, longitude: loc.coords.longitude - 0.001 },
          { latitude: loc.coords.latitude + 0.002, longitude: loc.coords.longitude - 0.001 },
          { latitude: loc.coords.latitude - 0.002, longitude: loc.coords.longitude + 0.002 },
        ];

        // Fetch elevations
        const elevations = await getElevations(otherPointsCoords);
        setPoints(elevations);
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

  // Normalize lat/lng to screen coordinates
  const normalize = (lat: number, lng: number) => {
    const scaling_factor = 100000;
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
          <View key={i} style={{ position: "absolute", left: x, top: y, alignItems: "center" }}>
            <View style={[styles.point, { backgroundColor: "green" }]} />
            <Text style={styles.elevationText}>{Math.round(p.elevation)} m</Text>
          </View>
        );
      })}

      {currentLocation && (
        <View style={{ position: "absolute", left: width / 2, top: height / 2, alignItems: "center" }}>
          <View style={[styles.point, { backgroundColor: "red" }]} />
          {currentLocation.elevation !== undefined && (
            <Text style={styles.elevationText}>{Math.round(currentLocation.elevation)} m</Text>
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

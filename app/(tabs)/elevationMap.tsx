import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MapPoint, RenderablePeak } from "@/models/map";
import { getElevation } from "@/services/elevationApi";
import { getPeaksInArea } from "@/services/openStreetMapApi";
import { transformToRenderablePeaks } from "@/utils/transformToRenderablePeaks";

const { width, height } = Dimensions.get("window");
const OBSERVER_HEIGHT = 1.6;
const LINE_SEGMENT_LENGTH = 250;
const NEARBY_PEAKS_RADIUS = 25000;
const POINT_SIZE = 12;

export default function ElevationMap() {
  const [loading, setLoading] = useState(true);
  const [peaks, setPeaks] = useState<RenderablePeak[]>([]);
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
        };
        setCurrentLocation(current);
        console.log("Current location with elevation:", current);

        const nearbyPeaks = await getPeaksInArea(current, NEARBY_PEAKS_RADIUS);
        console.log("Nearby peaks:", nearbyPeaks);

        const renderablePeaks = await transformToRenderablePeaks(
          current,
          nearbyPeaks,
          {
            observerHeight: OBSERVER_HEIGHT,
            lineSegmentLength: LINE_SEGMENT_LENGTH,
          },
        );
        setPeaks(renderablePeaks);
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

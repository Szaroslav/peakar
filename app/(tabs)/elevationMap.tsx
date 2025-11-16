import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { getElevations, getElevation } from "@/services/elevationApi";
import { generateNearbyPoints } from "@/utils/generatePoints";
import { calculateVisibilityLineOfSight } from "@/utils/markVisible";
import { MapPoint } from "@/models/map";
const { width, height } = Dimensions.get("window");
const POINT_SIZE = 12;

export default function ElevationMap() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<MapPoint | null>(null);
  const [heading, setHeading] = useState<number>(0);
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
        const fetchHeading = async () => {
          if (Platform.OS === "web") {
            return 0;
          }
          try {
            const headingData = await Location.getHeadingAsync();
            setHeading(headingData.trueHeading);
            console.log("Heading:", headingData.trueHeading);
            return headingData.trueHeading;
          } catch (error) {
            console.log("Heading error:", error);
            return 0;
          }
        };

        const headingValue = await fetchHeading();
        let otherPointsCoords: MapPoint[][] = generateNearbyPoints(
          current,
          headingValue,
        ).map((arc) =>
          arc.map((p) => ({
            latitude: p.latitude,
            longitude: p.longitude,
            elevation: 0,
            isVisible: false,
          })),
        );
        console.log("Other points coords:", otherPointsCoords);

        // Fetch elevations
        const elevation = await getElevations(otherPointsCoords.flat());
        console.log("Elevation coords:", elevation);
        let index = 0;
        for (let arc = 0; arc < otherPointsCoords.length; arc++) {
          for (let i = 0; i < otherPointsCoords[arc].length; i++) {
            otherPointsCoords[arc][i] = elevation[index++];
          }
        }
        otherPointsCoords = calculateVisibilityLineOfSight(
          current,
          1.5,
          otherPointsCoords,
        ); // assuming user height 1.5m
        setPoints(otherPointsCoords.flat());
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

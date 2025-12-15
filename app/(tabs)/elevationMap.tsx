import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Svg, Polygon } from "react-native-svg";
import { useNearbyPeaks } from "@/hooks/use-nearby-peaks";
import { useHeading } from "@/hooks/use-heading";
import { CAMERA_VIEW_ANGLE } from "@/constants/config";
import { toRad } from "@/utils/helpers";

const { width, height } = Dimensions.get("window");
const POINT_SIZE = 12;

export default function ElevationMap() {
  const { peaks, currentLocation, loading, error } = useNearbyPeaks();
  const heading = useHeading();
  const normalize = (lat: number, lng: number) => {
    const scaling_factor = 5000;
    if (!currentLocation) return { x: 0, y: 0 };
    const latRad = (currentLocation.latitude * Math.PI) / 180;
    const correctionX = Math.cos(latRad);
    const dx = (lng - currentLocation.longitude) * scaling_factor * correctionX;
    const dy = (lat - currentLocation.latitude) * scaling_factor;
    return { x: width / 2 + dx, y: height / 2 - dy };
  };
  const renderFOV = useMemo(() => {
    if (!currentLocation) return null;

    const cx = width / 2;
    const cy = height / 2;
    const r = Math.max(width, height) * 1.5;
    const halfAngle = CAMERA_VIEW_ANGLE / 2;
    const angleLeftRad = toRad(heading - halfAngle);
    const angleRightRad = toRad(heading + halfAngle);

    const x1 = cx + r * Math.sin(angleLeftRad);
    const y1 = cy - r * Math.cos(angleLeftRad);
    const x2 = cx + r * Math.sin(angleRightRad);
    const y2 = cy - r * Math.cos(angleRightRad);

    const points = `${cx},${cy} ${x1},${y1} ${x2},${y2}`;

    return (
      <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
        <Polygon
          points={points}
          fill="rgba(255, 255, 255, 0.15)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth={1}
        />
      </Svg>
    );
  }, [heading, width, height, currentLocation]);
  const renderedPeaks = useMemo(() => {
    return peaks.map((p, i) => {
      const { x, y } = normalize(p.latitude, p.longitude);
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            marginLeft: -POINT_SIZE / 2,
            marginTop: -POINT_SIZE / 2,
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
    });
  }, [peaks, currentLocation]);

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

  return (
    <View style={styles.container}>
      {renderFOV}
      {renderedPeaks}

      {currentLocation && (
        <View
          style={{
            position: "absolute",
            left: width / 2,
            top: height / 2,
            alignItems: "center",
            marginLeft: -50,
            marginTop: -50,
            width: 100,
            height: 100,
            justifyContent: "center",
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
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  mapPointElevation: {
    color: "#ececec",
    fontSize: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

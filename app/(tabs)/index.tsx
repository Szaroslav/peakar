import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useNearbyPeaks } from "@/components/nearby-peaks-provider";
import { CAMERA_VIEW_ANGLE } from "@/constants/config";
import { useHeading } from "@/hooks/use-heading";
import { CameraPoint, MapPoint, RenderablePeak } from "@/models/map";
import { getBearingDifference, mod, toDeg } from "@/utils/helpers";

const MIN_Y_ROTATION = 60;
const MAX_Y_ROTATION = 135;
const MAX_LINE_SIZE = 0.5;
const halfYRotationDiff = (MAX_Y_ROTATION - MIN_Y_ROTATION) / 2;

const { width, height } = Dimensions.get("window");

export default function App() {
  const rotY = useRef<number>(0);
  const [lineSize, setLineSize] = useState<number>(0);
  const [renderPeaks, setRenderPeaks] = useState<boolean>(true);
  const [points, setPoints] = useState<CameraPoint[]>([]);

  const [permission, requestPermission] = useCameraPermissions();
  const { peaks, currentLocation, loading, error, refetch } = useNearbyPeaks();
  const heading = (useHeading() + 90) % 360;

  useEffect(() => {
    const subscription = DeviceMotion.addListener(({ rotation }) => {
      const y = toDeg(Math.PI + rotation.gamma);
      if (Math.abs(y - rotY.current) > 0.05) {
        rotY.current = y;

        const rotatedY = mod(y - (MIN_Y_ROTATION + halfYRotationDiff), 360);
        const angleWithYAxis = Math.min(rotatedY, 360 - rotatedY);

        setLineSize(
          angleWithYAxis <= halfYRotationDiff
            ? 0
            : ((angleWithYAxis - halfYRotationDiff) /
                (180 - halfYRotationDiff)) *
                MAX_LINE_SIZE,
        );

        setRenderPeaks(angleWithYAxis <= halfYRotationDiff);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (peaks.length > 0) {
      const mappedPoints = mapPeaksToCameraPoints(
        currentLocation,
        heading,
        peaks,
      );
      setPoints(mappedPoints);
    }
  }, [heading, peaks]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function mapPeaksToCameraPoints(
    location: MapPoint | null,
    heading: number,
    peaks: RenderablePeak[],
  ): CameraPoint[] {
    console.log("Mapping peaks to camera points with heading:", heading);
    return peaks
      .map((peak) => ({
        ...peak,
        bearing: getBearingDifference(location, heading, peak),
      }))
      .filter(
        ({ isVisible, bearing }) =>
          isVisible && Math.abs(bearing) <= CAMERA_VIEW_ANGLE / 2,
      )
      .map((peak, index) => {
        const x =
          ((peak.bearing + CAMERA_VIEW_ANGLE / 2) / CAMERA_VIEW_ANGLE) * height;
        return {
          ...peak,
          x: width / 2 + (index % 2 === 0 ? -30 : 30),
          y: x,
        };
      });
  }
  if (loading) {
    return (
      <View style={[styles.center, { transform: [{ rotate: "90deg" }] }]}>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: "white" }}>Loading points…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text
          style={{
            color: "red",
            marginBottom: 10,
            transform: [{ rotate: "90deg" }],
          }}
        >
          {error}
        </Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.iconButton, { transform: [{ rotate: "90deg" }] }]}
            onPress={refetch}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={"back"}></CameraView>
      <View
        style={[
          styles.invalidYRotationIndicator,
          {
            width: Math.round(width * lineSize),
            left: Math.round(width * ((1.0 - lineSize) / 2)),
          },
        ]}
      />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={refetch}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh"
            size={24}
            color="white"
            style={{ transform: [{ rotate: "90deg" }] }}
          />
        </TouchableOpacity>
      </View>

      {renderPeaks && (
        <View style={styles.arOverlay} pointerEvents="box-none">
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.pointMarker,
                {
                  left: point.x,
                  top: point.y,
                },
              ]}
            >
              <View style={styles.dot} />
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{point.name}</Text>
                <Text style={styles.subText}>
                  {Math.round(point.elevation)} m
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  controls: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  arOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pointMarker: {
    position: "absolute",
    alignItems: "center",
    width: 100,
    marginLeft: -50,
    transform: [{ rotate: "90deg" }],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ff3b30",
    borderWidth: 2,
    borderColor: "white",
    marginBottom: 4,
  },
  labelContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  labelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  subText: {
    color: "#ddd",
    fontSize: 10,
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  invalidYRotationIndicator: {
    position: "absolute",
    height: 1,
    top: "50%",
    backgroundColor: "white",
    opacity: 0.8,
  },
});

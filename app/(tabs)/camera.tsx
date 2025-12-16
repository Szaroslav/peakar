import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNearbyPeaks } from "@/hooks/use-nearby-peaks";
import { useHeading } from "@/hooks/use-heading";
import { getBearingDifference } from "@/utils/helpers";
import { CameraPoint, MapPoint, RenderablePeak } from "@/models/map";
import { CAMERA_VIEW_ANGLE } from "@/constants/config";

const { width, height } = Dimensions.get("window");
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [points, setPoints] = useState<CameraPoint[]>([]);
  const { peaks, currentLocation, loading, error, refetch } = useNearbyPeaks();
  const heading = useHeading();

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
      .filter(
        (peak) =>
          peak.isVisible &&
          getBearingDifference(location, heading, peak) <=
            CAMERA_VIEW_ANGLE / 2,
      )
      .map((peak, index) => {
        const bearingDiff = getBearingDifference(location, heading, peak);
        const x =
          ((bearingDiff + CAMERA_VIEW_ANGLE / 2) / CAMERA_VIEW_ANGLE) * width;
        return {
          ...peak,
          x,
          y: height / 2 + (index % 2 === 0 ? -30 : 30),
        };
      });
  }
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
        <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButton}
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
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={refetch}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.arOverlay} pointerEvents="box-none">
        {points.map((point, index) => (
          <View
            key={index}
            style={[styles.pointMarker, { left: point.x, top: point.y }]}
          >
            <View style={styles.dot} />
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>{point.name}</Text>
              <Text style={styles.subText}>{point.elevation} m</Text>
            </View>
          </View>
        ))}
      </View>
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
});

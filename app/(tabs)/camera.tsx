import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { useNearbyPeaks } from "@/hooks/use-nearby-peaks";
import { useHeading } from "@/hooks/use-heading";
import { getBearingDifference } from "@/utils/helpers";
import { CameraPoint, MapPoint, RenderablePeak } from "@/models/map";

const { width, height } = Dimensions.get("window");
const CAMERA_VIEW_ANGLE = 60;

export default function App() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [points, setPoints] = useState<CameraPoint[]>([]);
  const { peaks, currentLocation, loading, error } = useNearbyPeaks();
  const heading = useHeading();

  useEffect(() => {
    if (peaks.length > 0) {
      const mappedPoints = mapPeaksToCameraPoints(currentLocation, heading, peaks);
      setPoints(mappedPoints);
    }
  }, [peaks, currentLocation, heading]);

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

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function mapPeaksToCameraPoints(location: MapPoint | null, heading: number, peaks: RenderablePeak[]): CameraPoint[] {
    return peaks
      .filter((peak) => peak.isVisible && getBearingDifference(location, heading, peak) <= CAMERA_VIEW_ANGLE / 2)
      .map((peak, index, array) => ({   
        ...peak,
        x: (width / array.length) * index + (width / (array.length * 2)),
        y: (height / 2) + (index % 2 === 0 ? -30 : 30),
      }));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.arOverlay} pointerEvents="box-none">
          {points.map((point, index) => (
            <View 
              key={index}
              style={[
                styles.pointMarker, 
                { left: point.x, top: point.y }
              ]}
            >
              <View style={styles.dot} />
              <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{point.name}</Text>
                <Text style={styles.subText}>{point.elevation} m</Text>
              </View>
            </View>
          ))}
        </View>

      </CameraView>
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
  arOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pointMarker: {
    position: 'absolute',
    alignItems: 'center',
    width: 100, 
    marginLeft: -50,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 4,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  labelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subText: {
    color: '#ddd',
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

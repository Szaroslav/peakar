import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { MapPoint, RenderablePeak } from "@/models/map";
import { getElevation } from "@/services/elevationApi";
import { getPeaksInArea } from "@/services/openStreetMapApi";
import { transformToRenderablePeaks } from "@/utils/transformToRenderablePeaks";

const OBSERVER_HEIGHT = 1.6;
const LINE_SEGMENT_LENGTH = 250;
const NEARBY_PEAKS_RADIUS = 7000;

export const useNearbyPeaks = () => {
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
        const elevation = await getElevation(
          loc.coords.latitude,
          loc.coords.longitude,
        );
        const current: MapPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          elevation: elevation,
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
  return { peaks, currentLocation, loading, error };
};

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const useHeading = () => {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      if (Platform.OS === "web") {
        return
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchHeadingAsync((obj) => {
        const { trueHeading, magHeading } = obj;
        console.log(`Heading update - True: ${trueHeading}, Magnetic: ${magHeading}`);
        if (trueHeading !== -1) {
          setHeading(trueHeading);
        } else {
          setHeading(magHeading);
        }
      });
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return heading;
};

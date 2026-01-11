import * as ScreenOrientation from "expo-screen-orientation";
import { useCallback, useState } from "react";

export const useScreenOrientation = () => {
  const [screenOrientationLock, setScreenOrientationLockState] =
    useState<ScreenOrientation.OrientationLock | null>(null);

  const setScreenOrientationLock = useCallback(
    async (orientationLock: ScreenOrientation.OrientationLock) => {
      await ScreenOrientation.lockAsync(orientationLock);
      setScreenOrientationLockState(orientationLock);
    },
    [],
  );

  return {
    screenOrientationLock,
    setScreenOrientationLock,
  };
};

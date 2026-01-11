import React, { createContext, ReactNode, useContext } from "react";

import { useNearbyPeaks as useNearbyPeaksHook } from "@/hooks/use-nearby-peaks";

type NearbyPeaksContext = ReturnType<typeof useNearbyPeaksHook> | null;

interface NearbyPeaksProviderProps {
  children: ReactNode;
}

const NearbyPeaksContext = createContext<NearbyPeaksContext>(null);

export const NearbyPeaksProvider = ({ children }: NearbyPeaksProviderProps) => {
  return (
    <NearbyPeaksContext.Provider value={useNearbyPeaksHook()}>
      {children}
    </NearbyPeaksContext.Provider>
  );
};

export function useNearbyPeaks() {
  const context = useContext(NearbyPeaksContext);
  if (!context) {
    throw new Error("useNearbyPeaks must be used within a NearbyPeaksProvider");
  }

  return context;
}

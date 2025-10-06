import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hazardAPI, Location } from '@/lib/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
  currentLocation: Location | null;
  updateLocation: (location: Location) => void;
  locationError: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const updateLocation = (location: Location) => {
    setCurrentLocation(location);
    if (isAuthenticated) {
      hazardAPI.updateLocation(location).catch(console.error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Get initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          updateLocation(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Could not get your location. Please enable location services.');
        }
      );
    }

    // Update location every 30 seconds
    const intervalId = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            };
            updateLocation(location);
          },
          (error) => {
            console.error('Error updating location:', error);
          }
        );
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  return (
    <LocationContext.Provider value={{ currentLocation, updateLocation, locationError }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

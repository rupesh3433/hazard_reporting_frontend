import { Hazard } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

interface HazardListProps {
  hazards: Hazard[];
}

const HazardList = ({ hazards }: HazardListProps) => {
  const { currentLocation } = useLocation();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getHazardVariant = (type: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      accident: 'destructive',
      pothole: 'default',
      flood: 'secondary',
      roadblock: 'destructive',
      'traffic jam': 'outline',
    };
    return variants[type.toLowerCase()] || 'default';
  };

  const sortedHazards = [...hazards].sort((a, b) => {
    if (!currentLocation) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    
    const distA = calculateDistance(
      currentLocation.lat,
      currentLocation.lon,
      a.location.lat,
      a.location.lon
    );
    const distB = calculateDistance(
      currentLocation.lat,
      currentLocation.lon,
      b.location.lat,
      b.location.lon
    );
    return distA - distB;
  });

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Recent Hazards
        </CardTitle>
        <CardDescription>
          {hazards.length} hazard{hazards.length !== 1 ? 's' : ''} reported
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-3">
        {sortedHazards.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hazards reported yet
          </p>
        ) : (
          sortedHazards.map((hazard) => {
            const distance = currentLocation
              ? calculateDistance(
                  currentLocation.lat,
                  currentLocation.lon,
                  hazard.location.lat,
                  hazard.location.lon
                )
              : null;

            return (
              <div
                key={hazard._id}
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={getHazardVariant(hazard.hazard_type)} className="capitalize">
                    {hazard.hazard_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {hazard.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm mb-3">{hazard.description}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{hazard.user_id}</span>
                  </div>
                  {distance !== null && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{distance.toFixed(2)} km away</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(hazard.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default HazardList;

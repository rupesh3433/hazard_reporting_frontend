import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hazardAPI, Hazard } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import HazardMap from '@/components/HazardMap';
import HazardList from '@/components/HazardList';
import VoiceRecorder from '@/components/VoiceRecorder';
import AlertNotification from '@/components/AlertNotification';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/LocationContext';

const Dashboard = () => {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const { user, logout, isAuthenticated } = useAuth();
  const { currentLocation } = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchHazards = async () => {
    try {
      const response = await hazardAPI.getHazards();
      setHazards(response.data);
    } catch (error) {
      console.error('Error fetching hazards:', error);
      toast({
        title: "Error",
        description: "Could not fetch hazards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
    
    // Refresh hazards every 30 seconds
    const intervalId = setInterval(fetchHazards, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // SocketIO connection for real-time alerts
  useEffect(() => {
    if (!user?.token) return;

    const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:5000';
    const socket: Socket = io(API_BASE_URL, {
      auth: {
        token: user.token,
      },
    });

    socket.on('connect', () => {
      console.log('✅ Connected to SocketIO');
    });

    socket.on('system', (data) => {
      console.log('System message:', data.message);
    });

    socket.on('hazard_alert', (data) => {
      console.log('🚨 Hazard alert received:', data);
      
      // Check if hazard is nearby (within 3km)
      if (currentLocation) {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lon,
          data.location.lat,
          data.location.lon
        );

        if (distance <= 3) {
          // Add alert to notifications
          const alertWithId = {
            ...data,
            id: Date.now().toString(),
          };
          setAlerts((prev) => [...prev, alertWithId]);
          
          // Refresh hazards list
          fetchHazards();
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from SocketIO');
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.token, currentLocation]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-warning/5">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Road Hazard Monitor</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.user_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchHazards}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Map & Voice Recorder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="h-[500px] rounded-xl overflow-hidden shadow-lg border bg-card">
              <HazardMap hazards={hazards} />
            </div>

            {/* Voice Recorder */}
            <VoiceRecorder onHazardReported={fetchHazards} />
          </div>

          {/* Right Column - Hazard List */}
          <div className="lg:col-span-1">
            <div className="h-[calc(100vh-180px)] sticky top-6">
              <HazardList hazards={hazards} />
            </div>
          </div>
        </div>
      </main>

      {/* Alert Notifications */}
      {alerts.map((alert, index) => (
        <div key={alert.id} style={{ top: `${4 + index * 140}px` }}>
          <AlertNotification alert={alert} onDismiss={() => dismissAlert(alert.id)} />
        </div>
      ))}
    </div>
  );
};

export default Dashboard;

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  type: string;
  description: string;
  location: { lat: number; lon: number };
  confidence: number;
  timestamp: string;
}

interface AlertNotificationProps {
  alert: Alert;
  onDismiss: () => void;
}

const AlertNotification = ({ alert, onDismiss }: AlertNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    // Play alert sound (optional)
    try {
      const audio = new Audio('/alert-sound.mp3');
      audio.play().catch(() => {
        // Ignore if sound doesn't play
      });
    } catch (error) {
      // Ignore sound errors
    }

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <Card
      className={`fixed top-4 right-4 z-50 w-80 p-4 border-l-4 border-l-critical shadow-2xl transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-critical/20 flex items-center justify-center flex-shrink-0 animate-pulse-alert">
          <AlertTriangle className="h-5 w-5 text-critical" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-critical capitalize mb-1">
            {alert.type} Nearby!
          </h3>
          <p className="text-sm text-foreground mb-2">{alert.description}</p>
          <p className="text-xs text-muted-foreground">
            {alert.confidence}% confidence • {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default AlertNotification;

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Play, Upload, Loader2 } from 'lucide-react';
import { hazardAPI } from '@/lib/api';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

const VoiceRecorder = ({ onHazardReported }: { onHazardReported: () => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      // Try to use WAV format if supported, otherwise use WebM
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak clearly to report the hazard",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please allow microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Preview your recording before uploading",
      });
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob || !currentLocation) {
      toast({
        title: "Upload Failed",
        description: "Missing audio or location data",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      // Determine file extension based on blob type
      const extension = audioBlob.type.includes('wav') ? 'wav' : 'webm';
      formData.append('file', audioBlob, `hazard_report.${extension}`);
      formData.append('lat', currentLocation.lat.toString());
      formData.append('lon', currentLocation.lon.toString());

      const response = await hazardAPI.reportVoice(formData);
      
      toast({
        title: "Hazard Reported Successfully",
        description: `"${response.data.description}" - Classified as: ${response.data.classified_as} (${response.data.confidence}% confidence)`,
      });
      
      // Reset recorder
      setAudioBlob(null);
      setAudioUrl('');
      audioChunksRef.current = [];
      
      // Notify parent to refresh hazards
      onHazardReported();
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      const errorMsg = error.response?.data?.error || "Could not upload hazard report. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Voice Hazard Report
        </CardTitle>
        <CardDescription>
          Record your voice to report a road hazard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isRecording && !audioBlob && (
            <Button onClick={startRecording} className="flex-1">
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" className="flex-1 animate-pulse-alert">
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="space-y-3">
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex gap-2">
              <Button onClick={uploadAudio} disabled={uploading} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl('');
                }}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {!currentLocation && (
          <p className="text-sm text-muted-foreground text-center">
            📍 Waiting for location...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;

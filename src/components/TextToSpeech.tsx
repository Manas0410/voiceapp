import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, Square, Download } from "lucide-react";

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "hi-IN", name: "Hindi (India)" },
    { code: "hi-IN-Standard-A", name: "Hindi (India) - Standard A" },
    { code: "hi-IN-Standard-B", name: "Hindi (India) - Standard B" },
    { code: "hi-IN-Standard-C", name: "Hindi (India) - Standard C" },
    { code: "hi-IN-Standard-D", name: "Hindi (India) - Standard D" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Mandarin)" },
  ];

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Set default voice for selected language
      const defaultVoice = voices.find((voice) =>
        voice.lang.startsWith(selectedLanguage.split("-")[0])
      );
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    // Update voice when language changes
    const voicesForLanguage = availableVoices.filter((voice) =>
      voice.lang.startsWith(selectedLanguage.split("-")[0])
    );

    if (voicesForLanguage.length > 0) {
      setSelectedVoice(voicesForLanguage[0].name);
    }
  }, [selectedLanguage, availableVoices]);

  const getVoicesForLanguage = () => {
    return availableVoices.filter((voice) =>
      voice.lang.startsWith(selectedLanguage.split("-")[0])
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setRecordedBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      // Start recording to capture the speech
      await startRecording();

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      // Set the language
      utterance.lang = selectedLanguage.includes("Standard")
        ? "hi-IN"
        : selectedLanguage;

      // Set the selected voice
      const voice = availableVoices.find((v) => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        // Stop recording after speech ends
        setTimeout(() => stopRecording(), 500);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        stopRecording();
      };

      synth.speak(utterance);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsLoading(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    stopRecording();
  };

  const downloadAudio = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speech-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Text to Speech
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="language-select" className="text-sm font-medium">
              Select Language:
            </label>
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="voice-select" className="text-sm font-medium">
              Select Voice:
            </label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {getVoicesForLanguage().map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="text-input" className="text-sm font-medium">
              Enter text to convert to speech:
            </label>
            <Input
              id="text-input"
              type="text"
              placeholder={
                selectedLanguage === "hi-IN"
                  ? "यहाँ अपना टेक्स्ट टाइप करें..."
                  : "Type your text here..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              onClick={generateSpeech}
              disabled={!text.trim() || isLoading || isPlaying}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isLoading ? "Loading..." : "Play"}
            </Button>

            <Button
              onClick={stopSpeech}
              disabled={!isPlaying}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>

            <Button
              onClick={downloadAudio}
              disabled={!recordedBlob}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {audioUrl && (
            <div className="mt-4">
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioUrl}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToSpeech;

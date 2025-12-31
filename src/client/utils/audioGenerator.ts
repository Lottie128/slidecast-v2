// Client-side audio generation using meSpeak.js (NO PERMISSIONS NEEDED!)

export const generateAudioFromText = async (text: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      // Check if meSpeak is loaded
      if (typeof (window as any).meSpeak === 'undefined') {
        console.warn('meSpeak not loaded, falling back to silent audio');
        resolve(null);
        return;
      }

      const meSpeak = (window as any).meSpeak;

      // Generate audio with options
      const wavData = meSpeak.speak(text, {
        rawdata: 'mime',
        speed: 150,
        pitch: 50,
        amplitude: 100,
        wordgap: 0,
        variant: 'f3' // Female voice variant
      });

      if (wavData) {
        // Convert base64 wav to blob
        const blob = dataURItoBlob(wavData);
        resolve(blob);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      resolve(null);
    }
  });
};

// Helper to convert data URI to Blob
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

// Decode audio blob to AudioBuffer
export const decodeAudioData = async (audioBlob: Blob): Promise<AudioBuffer | null> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error('Audio decode error:', error);
    return null;
  }
};

// Create combined audio track from multiple audio buffers
export const createCombinedAudioTrack = async (audioBuffers: AudioBuffer[], durations: number[]): Promise<MediaStream | null> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
    const dest = audioContext.createMediaStreamDestination();

    // Calculate total duration
    let currentTime = 0;

    // Schedule each audio buffer
    for (let i = 0; i < audioBuffers.length; i++) {
      const buffer = audioBuffers[i];
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(dest);
      source.start(currentTime);
      currentTime += durations[i];
    }

    return dest.stream;
  } catch (error) {
    console.error('Audio track creation error:', error);
    return null;
  }
};

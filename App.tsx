
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layer } from './types';
import { LAYER_DATA, IMAGE_URLS, BACKGROUND_COLOR, HOVER_SOUND_URL, BUILDING_LAYER_NAMES, OTHER_FEATURES_LAYER_NAMES, CLOUDS_CONFIG, INTERACTIVE_PLACEHOLDER_IMAGES } from './constants';
import LoadingScreen from './components/LoadingScreen';
import InteractiveMap from './components/InteractiveMap';
import ControlPanel from './components/ControlPanel';
import SoundControl from './components/SoundControl';
import InfoPanel from './components/InfoPanel';

const App: React.FC = () => {
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [hoveredLayerName, setHoveredLayerName] = useState<string | null>(null);

  // Web Audio API refs for robust sound handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const layers: Layer[] = useMemo(() => {
    return LAYER_DATA.map(layerData => ({
      ...layerData,
      url: IMAGE_URLS[layerData.name.replace(/ /g, '_')] || ''
    })).filter(layer => layer.url && layer.name !== 'Map Ledgend' && !hiddenLayers.has(layer.name));
  }, [hiddenLayers]);

  const handleToggleLayer = (layerIdentifier: string) => {
    setHiddenLayers(prev => {
      const next = new Set(prev);
      const toggleGroup = (group: string[]) => {
        const areAllShown = group.every(name => !prev.has(name));
        if (areAllShown) {
          group.forEach(name => next.add(name));
        } else {
          group.forEach(name => next.delete(name));
        }
      };

      if (layerIdentifier === 'Buildings') {
        toggleGroup(BUILDING_LAYER_NAMES);
      } else if (layerIdentifier === 'Features') {
        toggleGroup(OTHER_FEATURES_LAYER_NAMES);
      } else {
        if (next.has(layerIdentifier)) {
          next.delete(layerIdentifier);
        } else {
          next.add(layerIdentifier);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }

    const layerImageUrls = LAYER_DATA
        .map(layerData => IMAGE_URLS[layerData.name.replace(/ /g, '_')] || '');
    const cloudImageUrls = CLOUDS_CONFIG.map(cloud => cloud.src);
    
    const assetUrls = [...new Set(
        layerImageUrls
        .concat(IMAGE_URLS['Logo'])
        .concat(cloudImageUrls)
        .filter(url => !!url))];

    const totalAssets = assetUrls.length + 1; // +1 for the audio file
    let loadedCount = 0;

    const updateProgress = () => {
      loadedCount++;
      setLoadingProgress((loadedCount / totalAssets) * 100);
    };

    const preloadAudio = async () => {
      if (!audioContextRef.current) {
        console.warn("AudioContext not available, skipping audio preload.");
        updateProgress();
        return;
      }
      try {
        const response = await fetch(HOVER_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        const decodedAudio = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedAudio;
      } catch (error) {
        console.error("Failed to load and decode audio:", error);
      } finally {
        updateProgress();
      }
    };
    preloadAudio();

    assetUrls.forEach(url => {
      const img = new Image();
      img.src = url;
      const onFinish = () => {
        updateProgress();
      };
      img.onload = onFinish;
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
        onFinish(); 
      };
    });
  }, []);
  
  useEffect(() => {
    if (loadingProgress >= 100 && !assetsLoaded) {
      // All assets are reported as loaded.
      // We'll wait an additional 2 seconds to ensure everything, 
      // including rendering and audio decoding, is truly ready for a smooth transition.
      const transitionTimer = setTimeout(() => {
        setAssetsLoaded(true);
      }, 2000);

      return () => clearTimeout(transitionTimer); // Cleanup timer on unmount
    }
  }, [loadingProgress, assetsLoaded]);

  const playHoverSound = useCallback(() => {
    if (isMuted || !audioContextRef.current || !audioBufferRef.current) {
      return;
    }

    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;

    const play = () => {
      try {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (e) {
        console.error("Error playing sound:", e);
      }
    };

    // If context is suspended, the user's interaction (the one that called this function)
    // should be enough to resume it. This is key for mobile devices.
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        setAudioReady(true);
        play();
      }).catch(e => console.error("Audio resume failed on play:", e));
    } else {
      // If it's already running, ensure our state is up to date and play.
      if (!audioReady) setAudioReady(true);
      play();
    }
  }, [isMuted, audioReady]);
  
  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    
    // Also try to unlock audio context if it hasn't been already.
    // This makes the mute button a valid first interaction to enable audio.
    const audioContext = audioContextRef.current;
    if (!audioReady && audioContext && audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        setAudioReady(true);
      }).catch(e => console.error("Audio resume failed on mute toggle:", e));
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col md:block" style={{ backgroundColor: BACKGROUND_COLOR }}>
      {assetsLoaded && (
        <>
          <InfoPanel
            layerName={hoveredLayerName}
            imageUrls={hoveredLayerName ? INTERACTIVE_PLACEHOLDER_IMAGES[hoveredLayerName] : undefined}
          />
          <SoundControl isMuted={isMuted} onToggle={handleToggleMute} />
          
          {/* Desktop Logo */}
          <img src={IMAGE_URLS['Logo']} alt="Resort Logo" className="map-logo pointer-events-none hidden md:block" />

          {/* Mobile Header */}
          <header className="md:hidden text-center py-2 bg-black/20 shrink-0">
              <img src={IMAGE_URLS['Logo']} alt="Resort Logo" className="h-10 w-auto inline-block" />
          </header>
        </>
      )}
      
      {!assetsLoaded && (
        <LoadingScreen 
            progress={loadingProgress} 
            logoUrl={IMAGE_URLS['Logo']} 
        />
      )}

      <div className={`w-full transition-opacity duration-300 ${assetsLoaded ? 'opacity-100' : 'opacity-0'} flex-grow h-0 md:h-full`}>
        {assetsLoaded && <InteractiveMap layers={layers} playHoverSound={playHoverSound} hoveredLayerName={hoveredLayerName} setHoveredLayerName={setHoveredLayerName} />}
      </div>

      {assetsLoaded && <ControlPanel hiddenLayers={hiddenLayers} onToggle={handleToggleLayer} />}
    </div>
  );
};

export default App;
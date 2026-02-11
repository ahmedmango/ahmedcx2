import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface DeviceOrientationState {
  isActivated: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission: () => void;
}

export function useDeviceOrientation(thresholdMs = 2000): DeviceOrientationState {
  const isMobile = useIsMobile();
  const [isActivated, setIsActivated] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const flipStartRef = useRef<number | null>(null);
  const uprightStartRef = useRef<number | null>(null);
  const listenerAddedRef = useRef(false);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const beta = event.beta ?? 0;
    
    // Upside down: |beta| > 140
    const isUpsideDown = Math.abs(beta) > 140;
    // Upright: |beta| < 40
    const isUpright = Math.abs(beta) < 40;
    
    if (isUpsideDown) {
      // Reset upright timer
      uprightStartRef.current = null;
      
      if (!flipStartRef.current) {
        flipStartRef.current = Date.now();
      }
      
      // Activate after sustained flip
      if (!isActivated && Date.now() - flipStartRef.current >= thresholdMs) {
        setIsActivated(true);
      }
    } else if (isUpright) {
      // Reset flip timer
      flipStartRef.current = null;
      
      if (isActivated) {
        if (!uprightStartRef.current) {
          uprightStartRef.current = Date.now();
        }
        
        // Deactivate after sustained upright (shorter threshold for exit)
        if (Date.now() - uprightStartRef.current >= 1000) {
          setIsActivated(false);
          uprightStartRef.current = null;
        }
      }
    } else {
      // In-between position — reset both timers
      flipStartRef.current = null;
      uprightStartRef.current = null;
    }
  }, [isActivated, thresholdMs]);

  const addOrientationListener = useCallback(() => {
    if (listenerAddedRef.current) return;
    listenerAddedRef.current = true;
    window.addEventListener('deviceorientation', handleOrientation);
  }, [handleOrientation]);

  // Re-attach listener when handleOrientation changes (due to isActivated dep)
  useEffect(() => {
    if (!hasPermission || !isMobile || prefersReducedMotion) return;
    
    // Remove old listener and add new one with updated closure
    window.removeEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
    listenerAddedRef.current = true;

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      listenerAddedRef.current = false;
    };
  }, [handleOrientation, hasPermission, isMobile, prefersReducedMotion]);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setHasPermission(true);
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
      }
    } else {
      setHasPermission(true);
    }
  }, []);

  useEffect(() => {
    if (!isMobile || prefersReducedMotion) return;

    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);
      
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS — wait for user gesture
      } else {
        setHasPermission(true);
      }
    }
  }, [isMobile, prefersReducedMotion]);

  // iOS: Request permission on first touch
  useEffect(() => {
    if (!isMobile || prefersReducedMotion || !isSupported || hasPermission) return;
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') return;

    const handleFirstTouch = () => {
      requestPermission();
    };

    document.addEventListener('touchstart', handleFirstTouch, { once: true });
    document.addEventListener('click', handleFirstTouch, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('click', handleFirstTouch);
    };
  }, [isMobile, prefersReducedMotion, isSupported, hasPermission, requestPermission]);

  return {
    isActivated: isMobile && !prefersReducedMotion ? isActivated : false,
    isSupported,
    hasPermission,
    requestPermission,
  };
}

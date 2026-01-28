import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface DeviceOrientationState {
  isActivated: boolean;
  isSupported: boolean;
  hasPermission: boolean;
}

export function useDeviceOrientation(thresholdMs = 2000): DeviceOrientationState {
  const isMobile = useIsMobile();
  const [isActivated, setIsActivated] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const flipStartRef = useRef<number | null>(null);
  const activatedRef = useRef(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Already activated - don't retrigger
    if (activatedRef.current) return;

    const beta = event.beta ?? 0;
    
    // Upside down: beta < -150 or beta > 150
    const isUpsideDown = beta < -150 || beta > 150;
    
    if (isUpsideDown) {
      if (!flipStartRef.current) {
        flipStartRef.current = Date.now();
      }
      
      // Check if sustained for threshold duration
      if (Date.now() - flipStartRef.current >= thresholdMs) {
        activatedRef.current = true;
        setIsActivated(true);
        // Remove listener - one-time activation
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    } else {
      // Reset timer if not upside down
      flipStartRef.current = null;
    }
  }, [thresholdMs]);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setHasPermission(true);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (error) {
        console.log('Device orientation permission denied');
      }
    } else {
      setHasPermission(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }, [handleOrientation]);

  useEffect(() => {
    if (!isMobile || prefersReducedMotion) {
      return;
    }

    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);
      
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        setHasPermission(true);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile, prefersReducedMotion, handleOrientation]);

  // iOS permission request on first touch
  useEffect(() => {
    if (!isMobile || prefersReducedMotion || !isSupported || hasPermission) {
      return;
    }

    const handleFirstTouch = () => {
      requestPermission();
      document.removeEventListener('touchstart', handleFirstTouch);
    };

    document.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
    };
  }, [isMobile, prefersReducedMotion, isSupported, hasPermission, requestPermission]);

  return {
    isActivated: isMobile && !prefersReducedMotion ? isActivated : false,
    isSupported,
    hasPermission,
  };
}

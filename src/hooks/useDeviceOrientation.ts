import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './use-mobile';

interface DeviceOrientationState {
  isUpsideDown: boolean;
  isSupported: boolean;
  hasPermission: boolean;
}

export function useDeviceOrientation(thresholdMs = 600): DeviceOrientationState {
  const isMobile = useIsMobile();
  const [isUpsideDown, setIsUpsideDown] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const upsideDownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyUpsideDownRef = useRef(false);
  const confirmedUpsideDownRef = useRef(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Beta represents the device's rotation around the x-axis
    // When upside down, beta will be close to 180 or -180
    // We check if the device is approximately upside down
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;
    
    // Device is upside down when beta is close to ±180 and gamma is near 0
    // We use a range to account for natural hand movement
    const isFlipped = Math.abs(beta) > 140 && Math.abs(gamma) < 45;
    
    if (isFlipped && !isCurrentlyUpsideDownRef.current) {
      // Started being upside down
      isCurrentlyUpsideDownRef.current = true;
      
      // Start timer for threshold
      upsideDownTimerRef.current = setTimeout(() => {
        if (isCurrentlyUpsideDownRef.current && !confirmedUpsideDownRef.current) {
          confirmedUpsideDownRef.current = true;
          setIsUpsideDown(true);
        }
      }, thresholdMs);
      
    } else if (!isFlipped && isCurrentlyUpsideDownRef.current) {
      // No longer upside down
      isCurrentlyUpsideDownRef.current = false;
      
      // Clear the timer if we haven't confirmed yet
      if (upsideDownTimerRef.current) {
        clearTimeout(upsideDownTimerRef.current);
        upsideDownTimerRef.current = null;
      }
      
      // If we were in confirmed state, exit it
      if (confirmedUpsideDownRef.current) {
        confirmedUpsideDownRef.current = false;
        setIsUpsideDown(false);
      }
    }
  }, [thresholdMs]);

  const requestPermission = useCallback(async () => {
    // For iOS 13+, we need to request permission
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
      // For Android and older iOS, permission is implicit
      setHasPermission(true);
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }, [handleOrientation]);

  useEffect(() => {
    // Only enable on mobile devices
    if (!isMobile || prefersReducedMotion) {
      return;
    }

    // Check if DeviceOrientationEvent is supported
    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);
      
      // For iOS 13+, permission must be requested on user interaction
      // We'll auto-request on non-iOS or older iOS
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        setHasPermission(true);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (upsideDownTimerRef.current) {
        clearTimeout(upsideDownTimerRef.current);
      }
    };
  }, [isMobile, prefersReducedMotion, handleOrientation]);

  // For iOS, we need to request permission on first touch
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
    isUpsideDown: isMobile && !prefersReducedMotion ? isUpsideDown : false,
    isSupported,
    hasPermission,
  };
}

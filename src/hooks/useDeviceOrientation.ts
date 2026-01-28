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
  const activatedRef = useRef(false);
  const listenerAddedRef = useRef(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Already activated - don't retrigger
    if (activatedRef.current) return;

    const beta = event.beta ?? 0;
    
    // Upside down: beta < -150 or beta > 150
    // Also check for near 180 degrees (some devices report differently)
    const isUpsideDown = Math.abs(beta) > 140;
    
    if (isUpsideDown) {
      if (!flipStartRef.current) {
        flipStartRef.current = Date.now();
        console.log('Flip started, holding position...');
      }
      
      // Check if sustained for threshold duration
      if (Date.now() - flipStartRef.current >= thresholdMs) {
        console.log('Flip sustained - activating secret mode!');
        activatedRef.current = true;
        setIsActivated(true);
        // Remove listener - one-time activation
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    } else {
      // Reset timer if not upside down
      if (flipStartRef.current) {
        console.log('Flip reset - device returned to normal');
      }
      flipStartRef.current = null;
    }
  }, [thresholdMs]);

  const addOrientationListener = useCallback(() => {
    if (listenerAddedRef.current || activatedRef.current) return;
    console.log('Adding device orientation listener');
    listenerAddedRef.current = true;
    window.addEventListener('deviceorientation', handleOrientation);
  }, [handleOrientation]);

  const requestPermission = useCallback(async () => {
    console.log('Requesting device orientation permission...');
    
    // Check if this is iOS 13+ which requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        console.log('Permission result:', permission);
        if (permission === 'granted') {
          setHasPermission(true);
          addOrientationListener();
        } else {
          console.log('Device orientation permission denied');
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error);
      }
    } else {
      // Non-iOS or older iOS - permission not required
      console.log('Permission not required, adding listener directly');
      setHasPermission(true);
      addOrientationListener();
    }
  }, [addOrientationListener]);

  useEffect(() => {
    if (!isMobile || prefersReducedMotion) {
      console.log('Device orientation disabled:', { isMobile, prefersReducedMotion });
      return;
    }

    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true);
      console.log('DeviceOrientationEvent is supported');
      
      // Check if permission API exists (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        console.log('iOS permission API detected - waiting for user interaction');
        // iOS requires user gesture to request permission
        // We'll handle this via the requestPermission function
      } else {
        // Not iOS or older iOS - just add the listener
        console.log('No permission API - adding listener directly');
        setHasPermission(true);
        addOrientationListener();
      }
    } else {
      console.log('DeviceOrientationEvent not supported');
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile, prefersReducedMotion, handleOrientation, addOrientationListener]);

  // iOS: Request permission on first touch if not yet granted
  useEffect(() => {
    if (!isMobile || prefersReducedMotion || !isSupported || hasPermission) {
      return;
    }

    // Only set up touch handler if we need permission (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
      return;
    }

    const handleFirstTouch = () => {
      console.log('First touch detected - requesting permission');
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

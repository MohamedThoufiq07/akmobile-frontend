import { useEffect, useRef, useState } from 'react';
import { loadGsiScript, initializeGoogleIdentity, renderGoogleButton } from '../../utils/googleIdentity';

const GoogleSignInButton = ({ clientId, onSuccess, onError, className = '' }) => {
  const containerRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const renderedWidthRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Load script and initialize exactly once
  useEffect(() => {
    let isMounted = true;

    if (!clientId || !clientId.trim()) {
      return;
    }

    loadGsiScript()
      .then(() => {
        if (!isMounted) return;
        initializeGoogleIdentity(clientId, (response) => {
          if (response?.credential) {
            onSuccessRef.current?.(response);
          } else {
            onErrorRef.current?.(response);
          }
        });
        setIsReady(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        onErrorRef.current?.(err);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Responsive width measurement and rendering
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !isReady) return;

    const measureAndRender = (measuredWidth) => {
      let width = typeof measuredWidth === 'number' && measuredWidth > 0
        ? measuredWidth
        : (element.offsetWidth || element.clientWidth || 0);

      // In jsdom or headless test environments where offsetWidth is 0, default to 330
      if (width <= 0 && typeof window !== 'undefined' && !element.offsetWidth) {
        width = 330;
      }

      if (width > 0) {
        // Clamp to minimum 200px and preferred maximum 330px
        const clampedWidth = Math.min(Math.max(Math.floor(width), 200), 330);
        if (renderedWidthRef.current !== clampedWidth) {
          renderedWidthRef.current = clampedWidth;
          renderGoogleButton(element, { width: clampedWidth });
        }
      }
    };

    measureAndRender();

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect?.width || entry.target?.offsetWidth;
          if (w > 0) {
            measureAndRender(w);
          }
        }
      });
      resizeObserver.observe(element);
    } else {
      const handleResize = () => measureAndRender();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isReady, clientId]);

  return (
    <div className={`flex justify-center w-full min-h-[44px] ${className}`}>
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        data-testid="google-signin-container"
      />
    </div>
  );
};

export default GoogleSignInButton;

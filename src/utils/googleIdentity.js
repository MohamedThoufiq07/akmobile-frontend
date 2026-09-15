// Module-level singletons and guards for Google Identity Services
let scriptLoadPromise = null;
let initializedClientId = null;
let activeCredentialCallback = null;

export const GSI_SCRIPT_ID = 'google-gsi-client';
export const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Global dispatcher invoked by GIS when an ID token credential is returned.
 * Delegates to the currently active component callback.
 */
function handleCredentialResponse(response) {
  if (typeof activeCredentialCallback === 'function') {
    activeCredentialCallback(response);
  }
}

/**
 * Loads the Google Identity Services client script exactly once.
 * Reuses existing script if present on DOM or window.google.accounts.id if already loaded.
 */
export function loadGsiScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists in document
    let script = document.getElementById(GSI_SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = GSI_SCRIPT_ID;
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const onScriptLoad = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services loaded but accounts.id is unavailable.'));
      }
    };

    const onScriptError = (err) => {
      scriptLoadPromise = null;
      reject(err || new Error('Failed to load Google Identity Services script.'));
    };

    script.addEventListener('load', onScriptLoad, { once: true });
    script.addEventListener('error', onScriptError, { once: true });

    // Handle case where script was already loaded before listener attachment
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
    }
  });

  return scriptLoadPromise;
}

/**
 * Initializes Google Identity Services exactly once per browser page lifetime.
 * Guarantees that subsequent route mounts (e.g. after logout) or React StrictMode
 * double-mounts never call window.google.accounts.id.initialize() more than once.
 */
export function initializeGoogleIdentity(clientId, onCredential) {
  if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
    return;
  }

  const trimmedClientId = clientId.trim();
  activeCredentialCallback = onCredential;

  if (!window.google?.accounts?.id) {
    return;
  }

  if (initializedClientId === trimmedClientId) {
    // Already initialized for this page lifetime.
    // The activeCredentialCallback is updated above so the latest mounted component receives responses.
    return;
  }

  window.google.accounts.id.initialize({
    client_id: trimmedClientId,
    callback: handleCredentialResponse,
    ux_mode: 'popup',
    use_fedcm_for_button: false,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  initializedClientId = trimmedClientId;
}

/**
 * Renders the Google Identity Services button into a DOM container element.
 * Safely clears previous contents before rendering.
 */
export function renderGoogleButton(container, options = {}) {
  if (!container || !window.google?.accounts?.id) {
    return;
  }

  // Clear previous rendering safely
  container.innerHTML = '';

  const buttonOptions = {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    locale: 'en',
    ...options,
  };

  window.google.accounts.id.renderButton(container, buttonOptions);
}

/**
 * Helper to disable auto-select during application logout without revoking user account.
 */
export function disableGoogleAutoSelect() {
  try {
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch {
    // Gracefully handle any GIS missing context
  }
}

/**
 * Reset module-level singleton state (for unit testing purposes).
 */
export function __resetGoogleIdentityStateForTests() {
  initializedClientId = null;
  activeCredentialCallback = null;
  scriptLoadPromise = null;
}

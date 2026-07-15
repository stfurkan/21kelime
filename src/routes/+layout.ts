// The mobile app ships as a static SPA inside Capacitor, so rendering
// happens on the device; the web build keeps server-side rendering.
export const ssr = !__MOBILE__;

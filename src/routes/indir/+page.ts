// Prerendered on purpose. The redirect happens in the browser rather than
// on the server: it costs no Worker request (this is an ad landing page, so
// traffic can spike), and it is the only place iPadOS can be told apart
// from macOS, since iPads report a Macintosh user agent and only give
// themselves away through the touch-point count.
export const prerender = true;

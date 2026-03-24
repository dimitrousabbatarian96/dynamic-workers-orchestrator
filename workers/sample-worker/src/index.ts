export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    return new Response(`[sample-worker] Hello! You requested path: ${url.pathname}`);
  }
}

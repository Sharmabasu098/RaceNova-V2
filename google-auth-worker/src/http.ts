export function getCorsHeaders(
  request: Request,
  allowedOrigin: string
): Headers {
  const headers = new Headers();

  const origin = request.headers.get("Origin");

  if (origin === allowedOrigin) {
    headers.set(
      "Access-Control-Allow-Origin",
      allowedOrigin
    );

    headers.set(
      "Vary",
      "Origin"
    );
  }

  headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  return headers;
}

export function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Headers
): Response {
  const headers = new Headers(corsHeaders);

  headers.set(
    "Content-Type",
    "application/json; charset=utf-8"
  );

  headers.set(
    "Cache-Control",
    "no-store"
  );

  return new Response(
    JSON.stringify(body),
    {
      status,
      headers
    }
  );
}

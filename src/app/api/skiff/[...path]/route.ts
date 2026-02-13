import { NextRequest } from "next/server";

type Params = {
  params: Promise<{
    path: string[];
  }>;
};

const apiBaseURL = process.env.SKIFF_API_BASE_URL ?? "http://localhost:8080/api";

async function handler(request: NextRequest, { params }: Params) {
  const { path } = await params;
  const safeBase = apiBaseURL.endsWith("/") ? apiBaseURL.slice(0, -1) : apiBaseURL;
  const upstreamURL = new URL(`${safeBase}/${path.join("/")}`);
  upstreamURL.search = request.nextUrl.search;

  const headers = new Headers();
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyText = await request.text();
    if (bodyText.length > 0) {
      init.body = bodyText;
    }
  }

  const response = await fetch(upstreamURL, init);
  const responseText = await response.text();

  const passthroughHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  if (responseContentType) {
    passthroughHeaders.set("content-type", responseContentType);
  }

  return new Response(responseText, {
    status: response.status,
    headers: passthroughHeaders,
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE, handler as PUT };

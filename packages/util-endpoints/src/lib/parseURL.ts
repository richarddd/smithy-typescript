import { Endpoint, EndpointURL, EndpointURLScheme } from "@smithy-io/types";

import { isIpAddress } from "./isIpAddress";

const DEFAULT_PORTS: Record<EndpointURLScheme, number> = {
  [EndpointURLScheme.HTTP]: 80,
  [EndpointURLScheme.HTTPS]: 443,
};

/**
 * Parses a string, URL, or Endpoint into it’s Endpoint URL components.
 */
export const parseURL = (value: string | URL | Endpoint): EndpointURL | null => {
  const whatwgURL = (() => {
    try {
      if (value instanceof URL) {
        return value;
      }
      if (typeof value === "object" && "hostname" in value) {
        const { hostname, port, protocol = "", path = "", query = {} } = value as Endpoint;
        const url = new URL(`${protocol}//${hostname}${port ? `:${port}` : ""}${path}`);
        url.search = Object.entries(query)
          .map(([k, v]) => `${k}=${v}`)
          .join("&");
        return url;
      }
      return new URL(value);
    } catch (error) {
      return null;
    }
  })();

  if (!whatwgURL) {
    console.error(`Unable to parse ${JSON.stringify(value)} as a whatwg URL.`);
    return null;
  }

  const urlString = whatwgURL.href;

  const { host, hostname, pathname, protocol, search } = whatwgURL;

  if (search) {
    return null;
  }

  const scheme = protocol.slice(0, -1) as EndpointURLScheme;
  if (!Object.values(EndpointURLScheme).includes(scheme)) {
    return null;
  }

  const isIp = isIpAddress(hostname);

  const inputContainsDefaultPort =
    urlString.includes(`${host}:${DEFAULT_PORTS[scheme]}`) ||
    (typeof value === "string" && value.includes(`${host}:${DEFAULT_PORTS[scheme]}`));

  const authority = `${host}${inputContainsDefaultPort ? `:${DEFAULT_PORTS[scheme]}` : ``}`;

  return {
    scheme,
    authority,
    path: pathname,
    normalizedPath: pathname.endsWith("/") ? pathname : `${pathname}/`,
    isIp,
  };
};

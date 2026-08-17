import type { NextFunction, Request, Response } from "express";

// Sets an HTTP `Cache-Control` header so responses can be cached by browsers /
// CDNs for `maxAgeSeconds`. This is the lightweight caching approach for the
// public "Popular recipes" endpoint (no Redis needed): the frontend polls it
// periodically and the header lets intermediate caches serve it cheaply.
//
// Usage (later): router.get("/popular", cacheControl(env.POPULAR_RECIPES_CACHE_TTL), ...)
export const cacheControl =
  (maxAgeSeconds: number) => (_req: Request, res: Response, next: NextFunction) => {
    res.set("Cache-Control", `public, max-age=${maxAgeSeconds}`);
    next();
  };

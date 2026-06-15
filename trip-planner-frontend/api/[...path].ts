import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return res.status(503).json({
      message: 'BACKEND_URL is not set in Vercel. Add your Django API URL in project settings.',
    });
  }

  const pathParts = req.query.path;
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts ?? '');
  const normalized = subPath && !subPath.endsWith('/') ? `${subPath}/` : subPath;
  const target = `${backend.replace(/\/$/, '')}/api/${normalized}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body:
        req.method && !['GET', 'HEAD'].includes(req.method)
          ? JSON.stringify(req.body ?? {})
          : undefined,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    return res.send(text);
  } catch {
    return res.status(502).json({
      message: 'Could not reach the trip planning backend. Check BACKEND_URL and that Django is running.',
    });
  }
}

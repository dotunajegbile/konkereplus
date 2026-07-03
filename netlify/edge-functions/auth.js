// HTTP Basic Auth gate for the KonkerePlus preview.
//
// The password is read from the SITE_PASSWORD environment variable (set it in
// Netlify → Site configuration → Environment variables). It is NEVER stored in
// this public repo.
//
// Behaviour:
//   - If SITE_PASSWORD is unset  → gate is DISABLED (site is open). This is a
//     deliberate fail-open so a missing var can't lock you out.
//   - If SITE_PASSWORD is set     → every request must send Basic Auth with the
//     correct password (any username). Browsers show a native login prompt.
//
// To change or remove the password, just edit/delete the env var and redeploy —
// no code change needed.

export default async (request) => {
  const expected = Netlify.env.get('SITE_PASSWORD');
  if (!expected) return; // gate disabled — let the request through

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch { decoded = ''; }
    const password = decoded.slice(decoded.indexOf(':') + 1);
    if (password && password === expected) return; // authorised
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="KonkerePlus preview", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
};

export const config = { path: '/*' };

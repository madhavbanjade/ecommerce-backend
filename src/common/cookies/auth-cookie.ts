import { CookieOptions, Request, Response } from 'express';

export const getBaseCookieOptions = (req: Request): CookieOptions => {
  const isSecure =
    req.secure || req.get('x-forwarded-proto') === 'https';

  return {
    httpOnly: true,
    secure: isSecure, // false on localhost http
    sameSite: 'lax',
    path: '/',
  };
};

export const getAccessTokenCookieOptions = (
  req: Request,
): CookieOptions => ({
  ...getBaseCookieOptions(req),
  maxAge: 15 * 60 * 1000, // 15 minutes
});

export const getRefreshTokenCookieOptions = (
  req: Request,
): CookieOptions => ({
  ...getBaseCookieOptions(req),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const setAuthCookies = (
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie(
    'access_token',
    accessToken,
    getAccessTokenCookieOptions(req),
  );

  res.cookie(
    'refresh_token',
    refreshToken,
    getRefreshTokenCookieOptions(req),
  );
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
};

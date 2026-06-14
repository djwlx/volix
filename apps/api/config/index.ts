interface ConfigType {
  port: number;
  token: string;
  jwtExpiresIn: string;
}

const parsePort = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
};

const config: ConfigType = {
  port: parsePort(process.env.VOLIX_PORT ?? process.env.PORT, 3000),
  token: String(process.env.VOLIX_TOKEN_HEADER || '').trim() || 'volix-token',
  jwtExpiresIn: String(process.env.VOLIX_JWT_EXPIRES_IN || '').trim() || '30d',
};

export default config;

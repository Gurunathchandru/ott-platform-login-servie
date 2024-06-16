import { registerAs } from '@nestjs/config';
export default registerAs(
  'usersPgpConfig',
  () => ({
    publicKey: process.env.PGP_PUBLIC_KEY.replace(/\\n/g, '\n'),
    privateKey: process.env.PGP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    privateKeyPassword: process.env.PGP_PRIVATE_KEY_PASSWORD,
  }),
);
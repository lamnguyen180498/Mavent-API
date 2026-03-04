import { readFileSync } from 'fs';
import { resolve } from 'path';

export const readPrivateKey = (file = 'api_private') => {
  const filePath = resolve(__dirname, `../../storage/${file}.key`);
  try {
    return readFileSync(filePath, 'utf8');
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const readPublicKey = () => {
  const filePath = resolve(__dirname, '../../storage/api_public.key');
  try {
    return readFileSync(filePath, 'utf8');
  } catch (e) {
    console.log(e);
    return null;
  }
};

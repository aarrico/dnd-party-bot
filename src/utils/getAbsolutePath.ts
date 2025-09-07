import path from 'path';

export function getAbsolutePath(pathSTR: string) {
  return path.resolve(pathSTR).replace(/\//g, '/');
}

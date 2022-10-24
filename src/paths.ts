import path from 'path';

export const homeDir = process.env.HOME ?? process.env.USERPROFILE ?? '~/';
export const baseInstallDir = path.join(homeDir, '.local', 'bin', 'psqlvm');
export const downloadDir = path.join(homeDir, 'Downloads');
export const currentUsageDir = path.join(baseInstallDir, 'current');

export const getEditionInstallDir = (edition: string) => path.join(baseInstallDir, edition);
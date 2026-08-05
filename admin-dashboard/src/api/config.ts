import apiClient from './client';

export interface VersionConfig {
  minRequiredVersion: string;
  latestVersion: string;
  downloadUrl: string;
  message: string;
}

export const getPublicVersionConfig = async (): Promise<VersionConfig> => {
  const response = await apiClient.get<VersionConfig>('/config/version');
  return response.data;
};

export const updateVersionConfig = async (
  data: Partial<VersionConfig>
): Promise<{ message: string; config: VersionConfig }> => {
  const response = await apiClient.put<{ message: string; config: VersionConfig }>(
    '/admin/config/version',
    data
  );
  return response.data;
};

import apiClient from './client';

export interface SignupCode {
  code: string;
  grantsCourses: string[];
  boundEmail: string;
  isActive: boolean;
  createdAt: { _seconds: number };
  expiresAt: { _seconds: number } | null;
  usedBy: string | null;
  usedByName: string | null;
  usedAt: { _seconds: number } | null;
}

export const getCodes = async (): Promise<SignupCode[]> => {
  const res = await apiClient.get('/admin/codes');
  return res.data.codes;
};

export const generateCode = async (data: {
  email: string;
  grantsCourses: string[];
  expiresAt?: string;
}): Promise<{ code: string; boundEmail: string; grantsCourses: string[] }> => {
  const res = await apiClient.post('/admin/codes/generate', data);
  return res.data;
};

export const deactivateCode = async (code: string): Promise<void> => {
  await apiClient.delete(`/admin/codes/${code}`);
};

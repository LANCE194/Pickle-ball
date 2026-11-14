import { api } from '../../../../shared/lib/api';
import { FEATURE } from './constants';
// Thin helpers around the shared api client. Paths are relative to /api/staff/inquiries.
export const get = (p = '', q) => api.get(FEATURE.base + p, q);
export const post = (p = '', b) => api.post(FEATURE.base + p, b);
export const patch = (p = '', b) => api.patch(FEATURE.base + p, b);
export const put = (p = '', b) => api.put(FEATURE.base + p, b);
export const del = (p = '') => api.del(FEATURE.base + p);
export const upload = (p, form) => api.upload(FEATURE.base + p, form);

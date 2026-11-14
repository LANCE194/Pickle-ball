import { useApi } from '../../../../../shared/hooks/useApi';
import { FEATURE } from '../constants';
// Loads a list from this feature's API and re-loads when the server pushes a change.
export const useFeatureData = (path = '', params) => useApi(FEATURE.base + path, params);

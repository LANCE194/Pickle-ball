import { useSession } from './useSession';
/** useFeature('tournaments') -> true when the club has it on. Core features (null) are always on. */
export const useFeature = key => { const { features } = useSession(); return key ? features[key] !== false && features[key] !== undefined : true; };
export function FeatureGate({ featureKey, children, fallback = null }) { const on = useFeature(featureKey); return on ? children : fallback; }

import { ActivationFlow } from '../../../../../shared/components/PlayerAuth';
import { useNavigate } from 'react-router-dom';
export default function ActivationPage() { const nav = useNavigate(); return <ActivationFlow onLogin={() => nav('/player-login')} />; }

import { PlayerLoginForm } from '../../../../../shared/components/PlayerAuth';
import { useNavigate } from 'react-router-dom';
export default function PlayerLoginPage() { const nav = useNavigate(); return <PlayerLoginForm onActivate={() => nav('/activate')} />; }

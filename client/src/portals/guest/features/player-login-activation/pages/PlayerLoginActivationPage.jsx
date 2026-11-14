import { useState } from 'react';
import { PlayerLoginForm, ActivationFlow } from '../../../../../shared/components/PlayerAuth';
// Public Player Login with "First time? Set up your account". After login the person returns to the page they came from.
export default function PlayerLoginActivationPage() {
  const [mode, setMode] = useState('login');
  return <div className="px-4 py-8">{mode === 'login' ? <PlayerLoginForm onActivate={() => setMode('activate')} /> : <ActivationFlow onLogin={() => setMode('login')} />}</div>;
}

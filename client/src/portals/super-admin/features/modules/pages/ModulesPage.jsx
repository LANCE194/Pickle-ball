import { useApi } from '../../../../../shared/hooks/useApi';
import CrudPage from '../../../../../shared/components/CrudPage';
export default function ModulesPage() {
  return <CrudPage title="Modules" subtitle="Every role folder and feature folder the server found." listPath="/api/super-admin/modules" search="Search modules" empty={{ title: 'No modules found' }} columns="sm:grid-cols-2 lg:grid-cols-3"
    card={m => <div className="space-y-1"><p className="font-semibold">{m.label}</p><p className="muted">{m.role} / {m.folder}</p><p className="text-sm font-mono break-all">{m.mount}</p><p className="text-sm">{m.feature_key ? `Feature: ${m.feature_key}` : 'Core (always on)'}</p></div>} />;
}

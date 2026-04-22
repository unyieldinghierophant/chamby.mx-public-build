import { A } from '../adminTokens';
import { JobsTable } from '../components/JobsTable';

interface Props { searchQuery?: string }

export function TrabajosView({ searchQuery }: Props) {
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 }}>
      <JobsTable searchQuery={searchQuery} />
    </div>
  );
}

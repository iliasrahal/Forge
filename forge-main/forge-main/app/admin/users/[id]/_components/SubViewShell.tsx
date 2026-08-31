import { PageHeader, TableCard } from "../../../_components/ui";

export default function SubViewShell({
  userId,
  title,
  count,
  children,
}: {
  userId: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${count} au total · lecture seule, 100 lignes les plus récentes`}
        backHref={`/admin/users/${userId}`}
        backLabel="Retour à la fiche"
      />
      <TableCard>{children}</TableCard>
    </div>
  );
}

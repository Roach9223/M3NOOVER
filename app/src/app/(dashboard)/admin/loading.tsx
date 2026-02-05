import { TableSkeleton, PageHeaderSkeleton } from '@/components/ui';

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </div>
  );
}

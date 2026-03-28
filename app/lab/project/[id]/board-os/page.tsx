import { notFound } from 'next/navigation';
import { ProjectShellVariantPage } from '@/components/experiments/ProjectShellVariantPage';
import { featureFlags } from '@/lib/feature-flags';
import { getProjectShellModel } from '@/lib/experiments/project-shell';
import { normalizeProjectShellView } from '@/lib/experiments/shell-variants';

export const dynamic = 'force-dynamic';

export default async function LabBoardOsProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ view?: string; card?: string }>;
}) {
  if (!featureFlags.enableShellVariantLabs) {
    notFound();
  }

  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const model = getProjectShellModel(
    id,
    {
      view: normalizeProjectShellView(resolvedSearchParams.view),
      cardId: typeof resolvedSearchParams.card === 'string' ? resolvedSearchParams.card : null,
    },
  );

  if (!model) {
    notFound();
  }

  return (
    <ProjectShellVariantPage
      basePath={`/lab/project/${id}/board-os`}
      model={model}
      variant="board_os"
    />
  );
}

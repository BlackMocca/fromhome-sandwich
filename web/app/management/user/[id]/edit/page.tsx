import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/user-actions';
import { EditUserForm } from './edit-user-form';

/**
 * /management/user/[id]/edit — Edit existing user
 *
 * Server Component that loads the profile, then hands it
 * to the client `<EditUserForm>`.
 */
export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile(id);

  if (!profile) {
    notFound();
  }

  return <EditUserForm profile={profile} />;
}

export const dynamic = 'force-dynamic';

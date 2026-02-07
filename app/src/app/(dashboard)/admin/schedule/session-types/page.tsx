import { redirect } from 'next/navigation';

export default function SessionTypesRedirect() {
  redirect('/admin/settings');
}

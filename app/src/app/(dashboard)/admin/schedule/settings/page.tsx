import { redirect } from 'next/navigation';

export default function ScheduleSettingsRedirect() {
  redirect('/admin/settings');
}

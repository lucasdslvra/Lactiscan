import { Redirect } from 'expo-router';

import { useStoredVerdictSettings } from '@/hooks/use-verdict-settings';

export default function Index() {
  const hasProfile = useStoredVerdictSettings() !== null;
  return <Redirect href={hasProfile ? '/scan' : '/profil'} />;
}

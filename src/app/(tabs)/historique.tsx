import { History } from 'lucide-react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function HistoriqueScreen() {
  return (
    <ScreenPlaceholder
      icon={History}
      title="Historique"
      description="Les produits que vous scannez apparaîtront ici."
    />
  );
}

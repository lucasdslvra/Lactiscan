import { Search } from 'lucide-react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function ConsultationScreen() {
  return (
    <ScreenPlaceholder
      icon={Search}
      title="Consultation"
      description="Saisissez un code-barres pour consulter la fiche d'un produit."
    />
  );
}

import { Settings } from 'lucide-react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function ReglagesScreen() {
  return (
    <ScreenPlaceholder
      icon={Settings}
      title="Réglages"
      description="Choisissez votre mode : « Sans lactose » ou « Sans lait strict »."
    />
  );
}

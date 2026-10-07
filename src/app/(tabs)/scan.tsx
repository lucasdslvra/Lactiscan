import { router } from 'expo-router';
import { Keyboard, ScanBarcode } from 'lucide-react-native';

import { ScreenPlaceholder } from '@/components/screen-placeholder';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function ScanScreen() {
  return (
    <ScreenPlaceholder
      icon={ScanBarcode}
      title="Scanner un produit"
      description="Pointez la caméra vers le code-barres pour savoir s'il contient du lait.">
      <Button size="lg" className="mt-2" onPress={() => router.navigate('/consultation')}>
        <Icon as={Keyboard} size={18} />
        <Text>Saisir le code à la main</Text>
      </Button>
    </ScreenPlaceholder>
  );
}

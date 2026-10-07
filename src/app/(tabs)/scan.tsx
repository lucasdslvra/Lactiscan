import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { BarcodeScanner } from '@/components/scan/barcode-scanner';
import { CameraDenied } from '@/components/scan/camera-denied';
import { useCameraPermission } from '@/hooks/use-camera-permission';

export default function ScanScreen() {
  const { permission, request, openSettings } = useCameraPermission();
  const isFocused = useIsFocused();

  const denied =
    !!permission &&
    !permission.granted &&
    (permission.status === 'denied' || !permission.canAskAgain);

  if (denied) {
    return (
      <>
        {isFocused && <StatusBar style="dark" />}
        <CameraDenied
          permission={permission}
          onRequest={() => void request()}
          onOpenSettings={() => void openSettings()}
        />
      </>
    );
  }

  // Never an empty screen: while the status is read (`null`) or not decided yet, the frame and
  // the manual entry stay available, plus a way to ask again if the system dialog was dismissed.
  return (
    <>
      {isFocused && <StatusBar style="light" />}
      <BarcodeScanner
        cameraEnabled={!!permission?.granted}
        onRequestPermission={permission?.status === 'undetermined' ? () => void request() : undefined}
      />
    </>
  );
}

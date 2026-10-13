import { View } from 'react-native';

import { ScannedProductRow } from '@/components/consultation/scanned-product-row';
import { VerdictIcon } from '@/components/product/verdict-icon';
import { DashedRule } from '@/components/profile/dashed-rule';
import { PROFILES } from '@/components/profile/profile-copy';
import { Text } from '@/components/ui/text';
import type { EquivalencesFile, ManualEquivalence, Replacement } from '@/lib/equivalences';
import { formatEquivalencesVersion } from '@/lib/equivalences';
import { foodProducts, replacementsForMode, type CategoryProducts } from '@/lib/food-search';
import { LABEL } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { MODE_LABEL, profileLabel, type VerdictSettings } from '@/lib/verdict';

const MONO = 'font-mono text-ink text-[11px] tracking-[1.1px]';

/**
 * « Équivalences » card of the « 05 · Consultation » mockup: the food, the replacements the
 * active profile can use (`manual`), then the most scanned products of its categories (`auto`)
 * that the profile accepts. All of it comes from the equivalences file, so it works offline.
 */
export function EquivalenceCard({
  food,
  file,
  settings,
}: {
  food: ManualEquivalence;
  file: EquivalencesFile;
  settings: VerdictSettings;
}) {
  const replacements = replacementsForMode(food.replacements, settings.mode);
  const categories = foodProducts(file, food, settings);
  const nothing = replacements.length === 0 && categories.length === 0;

  return (
    <View
      role="region"
      aria-label={`Équivalences : ${food.name}`}
      className="border-ink bg-field mx-3 mt-[22px] border-2">
      <View className="gap-1.5 px-4 pb-3.5 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className={MONO}>ÉQUIVALENCES</Text>
          <Text className="bg-ink font-mono text-paper px-1.5 py-[3px] text-[11px] tracking-[1.1px]">
            {profileLabel(settings)}
          </Text>
        </View>
        <Text
          role="heading"
          className="font-display text-ink pt-1 text-[52px] uppercase leading-[46px]">
          {food.name}
        </Text>
        <Text className="font-body text-ink-muted text-[13px] leading-[18px]">
          Aussi trouvé sous : {food.synonyms.join(', ')}
        </Text>
      </View>
      <DashedRule />

      {replacements.length > 0 ? (
        <>
          <View role="list">
            {replacements.map((replacement, index) => (
              <ReplacementRow
                key={replacement.name}
                replacement={replacement}
                rank={index + 1}
                last={index === replacements.length - 1}
              />
            ))}
          </View>
          {categories.length > 0 && <DashedRule />}
        </>
      ) : (
        <NoEquivalence settings={settings} nothing={nothing} />
      )}

      {categories.map((category) => (
        <MostScanned key={category.categoryTag} category={category} />
      ))}

      <DashedRule className="mt-1" />
      <View className="flex-row justify-between px-4 py-2.5">
        <Text className="font-mono text-ink-muted text-[10px] tracking-[0.8px]">
          DISPONIBLE HORS LIGNE
        </Text>
        <Text className="font-mono text-ink-muted text-[10px] tracking-[0.8px]">
          LISTE DU {formatEquivalencesVersion(file.version)}
        </Text>
      </View>
    </View>
  );
}

// Blue check for a milk-free replacement, yellow half disc for a lactose-free one: the colors
// and icons of the « Sans lait » and « Sans lactose » verdicts.
const COMPATIBILITY = {
  strict: { background: 'bg-verdict-free', icon: 'milk-free' },
  'lactose-free': { background: 'bg-verdict-lactose', icon: 'lactose-free' },
} as const;

function ReplacementRow({
  replacement,
  rank,
  last,
}: {
  replacement: Replacement;
  rank: number;
  last: boolean;
}) {
  const compatibility = COMPATIBILITY[replacement.mode];

  return (
    <View
      role="listitem"
      className={cn('border-ink flex-row gap-2.5 px-4 py-3.5', !last && 'border-b-[1.5px]')}>
      <Text aria-hidden className="font-display text-ink w-[34px] text-[28px] leading-[30px]">
        {String(rank).padStart(2, '0')}
      </Text>
      <View className="min-w-0 flex-1 gap-[5px]">
        <Text className="font-body-bold text-ink text-[17px]">{replacement.name}</Text>
        {!!replacement.note && (
          <Text className="font-body text-ink text-sm leading-[20px]">{replacement.note}</Text>
        )}
        <View
          className={cn(
            'border-ink flex-row items-center gap-[5px] self-start border-[1.5px] px-[7px] py-[3px]',
            compatibility.background
          )}>
          <VerdictIcon kind={compatibility.icon} color={LABEL.ink} size={12} />
          <Text className="font-mono-semibold text-ink text-[10px] tracking-[0.8px]">
            COMPATIBLE {MODE_LABEL[replacement.mode]}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** No replacement suits the profile; `nothing`: no product of its categories either. */
function NoEquivalence({ settings, nothing }: { settings: VerdictSettings; nothing: boolean }) {
  const profile = PROFILES.find((candidate) => candidate.mode === settings.mode)?.title;

  return (
    <View className="border-ink m-4 gap-2 border-2 p-4">
      <Text className="font-mono text-ink text-[10px] tracking-[1.2px]">AUCUNE ÉQUIVALENCE</Text>
      <Text className="font-display text-ink text-3xl uppercase leading-[27px]">
        Rien de compatible
      </Text>
      <Text className="font-body text-ink text-sm leading-[20px]">
        {nothing
          ? `Aucune équivalence de cet aliment ne convient au profil ${profile}. Lisez l'étiquette des produits avant d'acheter.`
          : `Aucune équivalence de cet aliment ne convient au profil ${profile}. Voici des produits compatibles.`}
      </Text>
    </View>
  );
}

function MostScanned({ category }: { category: CategoryProducts }) {
  return (
    <View>
      <Text
        role="heading"
        className="font-mono-semibold text-ink px-4 pb-1 pt-3.5 text-[11px] tracking-[1.1px]">
        LES PLUS SCANNÉS · {category.label}
      </Text>
      <View className="px-4">
        {category.products.map((product, index) => (
          <ScannedProductRow
            key={product.code}
            product={product}
            last={index === category.products.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

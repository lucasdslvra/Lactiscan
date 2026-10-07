import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { tracesSentence } from '@/lib/allergens';
import type { DairyIngredients } from '@/lib/dairy';
import type { ProductIngredients } from '@/lib/product';

interface IngredientsSectionProps {
  ingredients: ProductIngredients | null;
  dairy: DairyIngredients;
  /** Off when the verdict is « Sans lait »: nothing is highlighted then. */
  highlight: boolean;
  tracesTags: string[] | undefined;
}

/** Ingredient list, French first, with the « peut contenir » traces in a box of their own. */
export function IngredientsSection({
  ingredients,
  dairy,
  highlight,
  tracesTags,
}: IngredientsSectionProps) {
  const marked = highlight && dairy.names.length > 0;
  const spokenList =
    ingredients && marked
      ? `${ingredients.text} Ingrédients laitiers : ${dairy.names.join(', ')}.`
      : undefined;

  return (
    <View className="gap-2.5 px-4 pt-[30px]">
      <View role="heading" className="flex-row justify-between">
        <Text className="font-mono-semibold text-ink text-[11px] tracking-[1.3px]">
          INGRÉDIENTS
        </Text>
        {ingredients && (
          <Text className="font-mono text-ink-muted text-[11px] tracking-[1.3px]">
            {ingredients.lang === 'fr' ? 'EN FRANÇAIS' : "LANGUE D'ORIGINE"}
          </Text>
        )}
      </View>

      {ingredients ? (
        <Text aria-label={spokenList} className="font-body text-ink text-base leading-[26px]">
          {marked
            ? dairy.parts.map((part, i) =>
                part.dairy ? (
                  <Text
                    key={i}
                    className="bg-mark font-body-bold text-mark-ink text-base underline">
                    {part.text}
                  </Text>
                ) : (
                  part.text
                )
              )
            : ingredients.text}
        </Text>
      ) : (
        <Text className="font-body text-ink-muted text-base leading-[26px]">
          Ingrédients non renseignés sur Open Food Facts.
        </Text>
      )}

      <View className="border-ink flex-row items-baseline gap-3 border-2 px-3 py-2.5">
        <Text className="font-mono-semibold text-ink shrink-0 text-[11px] tracking-[1.1px]">
          TRACES
        </Text>
        <Text className="font-body text-ink flex-1 text-sm leading-[20px]">
          {tracesSentence(tracesTags)}
        </Text>
      </View>
    </View>
  );
}

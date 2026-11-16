import type { BadgeTone } from '@shared/ui/styles';
import { formatDiscount } from '@shared/lib/format';
import type { Perfume } from '../schemas';
import { discountPercent, isAvailable } from './pricing';

export interface BadgeView {
  key: 'nuevo' | 'oferta' | 'bajo-encargo' | 'preventa' | 'agotado';
  label: string;
  tone: BadgeTone;
}

/** Insignias visibles de un perfume, en orden de prioridad. Agotado anula las demás. */
export function getPerfumeBadges(perfume: Perfume): BadgeView[] {
  if (!isAvailable(perfume)) return [{ key: 'agotado', label: 'Agotado', tone: 'muted' }];

  const badges: BadgeView[] = [];
  const discount = discountPercent(perfume);
  if (discount > 0) badges.push({ key: 'oferta', label: formatDiscount(discount), tone: 'accent' });
  if (perfume.badges.includes('nuevo')) badges.push({ key: 'nuevo', label: 'Nuevo', tone: 'ink' });
  if (perfume.badges.includes('preventa'))
    badges.push({ key: 'preventa', label: 'Preventa', tone: 'paper' });
  if (perfume.badges.includes('bajo-encargo'))
    badges.push({ key: 'bajo-encargo', label: 'Bajo encargo', tone: 'outline' });
  return badges;
}

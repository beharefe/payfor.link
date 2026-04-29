import {
  getActivePromotionsForSeller,
  type SellerPromotion,
} from "@unseallink/lib/promotions/promotions-service";

interface Props {
  sellerId: string;
}

export async function PromotionBanners({ sellerId }: Props) {
  const promotions = await getActivePromotionsForSeller(sellerId);
  if (!promotions.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {promotions.map((sp) => (
        <PromotionBanner key={sp.id} sellerPromotion={sp} />
      ))}
    </div>
  );
}

function PromotionBanner({ sellerPromotion: sp }: { sellerPromotion: SellerPromotion }) {
  const content = renderBannerContent(sp);
  if (!content) return null;

  const progressPercent =
    sp.max_value > 0 ? Math.min(100, Math.round((sp.used_value / sp.max_value) * 100)) : 0;

  const expiresAt = sp.expires_at
    ? new Date(sp.expires_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-800 dark:bg-emerald-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {content.icon} {sp.promotion.name}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
            {sp.promotion.description ?? content.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 tabular-nums">
            {content.remainingLabel}
          </p>
          {expiresAt && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              until {expiresAt}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {sp.max_value > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-emerald-200 dark:bg-emerald-800">
            <div
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {content.usedLabel} used
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {content.maxLabel} total
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Banner content per promotion type.
// Add new cases here when you add new promotion types.
// ============================================================
function renderBannerContent(sp: SellerPromotion): {
  icon: string;
  description: string;
  remainingLabel: string;
  usedLabel: string;
  maxLabel: string;
} | null {
  const config = sp.config_snapshot;
  const remaining = sp.max_value - sp.used_value;

  switch (sp.promotion.type) {
    case "fee_waiver_gmv": {
      const remainingDollars = (remaining / 100).toFixed(2);
      const usedDollars = (sp.used_value / 100).toFixed(2);
      const maxDollars = (sp.max_value / 100).toFixed(2);
      return {
        icon: "⚡",
        description: `Your next $${remainingDollars} in sales are platform fee-free (0% platform cut). Stripe card processing fees still apply.`,
        remainingLabel: `$${remainingDollars} fee-free left`,
        usedLabel: `$${usedDollars}`,
        maxLabel: `$${maxDollars}`,
      };
    }

    case "fee_rate_reduction": {
      const reductionBps = Number(config.reduction_bps ?? 0);
      const reductionPct = (reductionBps / 100).toFixed(1);
      const remainingDays = Math.max(0, remaining);
      return {
        icon: "🎯",
        description: `Your platform fee is reduced by ${reductionPct}%.`,
        remainingLabel: `${remainingDays} days left`,
        usedLabel: `${sp.used_value}d`,
        maxLabel: `${sp.max_value}d`,
      };
    }

    case "flat_credit": {
      const remainingDollars = (remaining / 100).toFixed(2);
      const usedDollars = (sp.used_value / 100).toFixed(2);
      const maxDollars = (sp.max_value / 100).toFixed(2);
      return {
        icon: "💳",
        description: `$${remainingDollars} in credits applied to your fees.`,
        remainingLabel: `$${remainingDollars} credit left`,
        usedLabel: `$${usedDollars}`,
        maxLabel: `$${maxDollars}`,
      };
    }

    case "feature_unlock": {
      const featureKey = String(config.feature_key ?? "Feature");
      const remainingDays = Math.max(0, remaining);
      return {
        icon: "🔓",
        description: `${featureKey} is unlocked on your account.`,
        remainingLabel: `${remainingDays} days left`,
        usedLabel: `${sp.used_value}d`,
        maxLabel: `${sp.max_value}d`,
      };
    }

    default:
      return null;
  }
}

import { siteConfig } from "@/config/site";

const quantityFmt = new Intl.NumberFormat(siteConfig.locale, { maximumFractionDigits: 2 });

export function formatQuantity(value: number): string {
  return quantityFmt.format(value);
}

const madFormatter = new Intl.NumberFormat("en-MA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-MA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-MA", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatMAD = (centimes: number): string =>
  `${madFormatter.format(centimes / 100)} MAD`;

export const formatQuantity = (
  quantity: number,
  unit?: string | null,
): string => {
  const formatted = Number.isInteger(quantity)
    ? quantity.toLocaleString("en-MA")
    : quantity.toLocaleString("en-MA", { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit.toLowerCase()}` : formatted;
};

export const formatDate = (value?: string | null): string =>
  value ? dateFormatter.format(new Date(value)) : "Not scheduled";

export const formatDateTime = (value?: string | null): string =>
  value ? dateTimeFormatter.format(new Date(value)) : "Not available";

export const formatPercent = (value: number): string =>
  `${Math.round(value * 100)}%`;

export const titleCase = (value: string): string =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

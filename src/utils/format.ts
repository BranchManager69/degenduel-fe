export const formatNumber = (value: string | number, decimals = 2) => {
  const num = Number(value);
  if (isNaN(num)) return "0";

  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
  return num.toFixed(decimals);
};

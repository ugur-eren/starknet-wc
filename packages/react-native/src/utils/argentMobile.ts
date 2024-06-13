export const getArgentMobileURL = (uri: string) => {
  return `argent://app/wc?uri=${encodeURIComponent(uri)}&device=mobile`;
};

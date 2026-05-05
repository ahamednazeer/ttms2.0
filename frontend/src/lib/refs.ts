type RefLike<T extends { _id?: string }> = string | T | null | undefined;

export function getRefId<T extends { _id?: string }>(value: RefLike<T>) {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id || '';
}

export function getRefName<T extends { _id?: string }>(
  value: RefLike<T>,
  key: keyof T,
  fallback = '-',
) {
  if (!value || typeof value === 'string') return fallback;
  const name = value[key];
  return typeof name === 'string' && name.trim() ? name : fallback;
}

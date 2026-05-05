import { Types } from 'mongoose';

type RefLike = string | Types.ObjectId | { _id?: string | Types.ObjectId } | null | undefined;

export function normalizeRefId(value: RefLike) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  return normalizeRefId(value._id);
}

export function toMongoId(value: RefLike) {
  const id = normalizeRefId(value);
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
}

export function refIdFilter(field: string, value: RefLike) {
  const id = normalizeRefId(value);
  if (!id) return {};

  return {
    $or: [
      { [field]: id },
      ...(Types.ObjectId.isValid(id) ? [{ [field]: new Types.ObjectId(id) }] : []),
    ],
  };
}

export function normalizeObjectIdFields<T extends Record<string, any>>(data: T, fields: string[]) {
  const next: Record<string, any> = { ...data };
  for (const field of fields) {
    if (next[field]) {
      next[field] = toMongoId(next[field]);
    }
  }
  return next as T;
}

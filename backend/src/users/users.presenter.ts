type RefValue = { _id?: string; cityName?: string; vendorName?: string; vehicleNo?: string } | string | undefined | null;

function presentRef(value: RefValue, labelKeys: string[] = []) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;

  const result: Record<string, string> = {
    _id: String(value._id || ''),
  };

  for (const key of labelKeys) {
    const labelValue = (value as Record<string, unknown>)[key];
    if (typeof labelValue === 'string' && labelValue.length > 0) {
      result[key] = labelValue;
    }
  }

  return result;
}

export function presentUser(user: Record<string, any>) {
  return {
    _id: String(user._id),
    username: user.username,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    active: user.active,
    cityId: presentRef(user.cityId, ['cityName']),
    vendorId: presentRef(user.vendorId, ['vendorName']),
    transportId: presentRef(user.transportId, ['vehicleNo']),
  };
}

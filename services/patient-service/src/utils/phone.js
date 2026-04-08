const SRI_LANKA_CODE = "+94";

const normalizeSriLankanPhone = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (trimmed.startsWith(SRI_LANKA_CODE)) {
    return `${SRI_LANKA_CODE}${digits.slice(2)}`;
  }

  if (digits.startsWith("94")) {
    return `${SRI_LANKA_CODE}${digits.slice(2)}`;
  }

  if (digits.startsWith("0")) {
    return `${SRI_LANKA_CODE}${digits.slice(1)}`;
  }

  return `${SRI_LANKA_CODE}${digits}`;
};

const normalizePatientProfilePhones = (profile = {}) => ({
  ...profile,
  phone: normalizeSriLankanPhone(profile.phone),
  emergencyContact: profile.emergencyContact
    ? {
        ...profile.emergencyContact,
        phone: normalizeSriLankanPhone(profile.emergencyContact.phone)
      }
    : profile.emergencyContact
});

module.exports = {
  normalizeSriLankanPhone,
  normalizePatientProfilePhones
};

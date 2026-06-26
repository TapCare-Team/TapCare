export const householdValidationMessages = {
  addressRequired: "Block and street address is required.",
  addressTooShort: "Block and street address must be at least 5 characters.",
  addressNeedsNumberAndName: "Block and street address must include both a number and a street or building name.",
  addressNeedsStreetType: "Block and street address should include a recognizable street type, such as Road, Street, Avenue, Drive, Lane, or Close.",
  addressLooksInvalid: "Block and street address looks invalid. Please enter the actual street or building name.",
  addressDetailsLookInvalid: "Additional address details look invalid. Please enter a real landmark or leave it blank.",
  unitInvalid: "Unit number should look like #03-145.",
  postalInvalid: "Postal code must be 6 digits.",
  postalPlaceholder: "Postal code looks like a placeholder. Please enter the actual 6-digit postal code."
} as const;

const streetTypePattern =
  /\b(?:avenue|ave|boulevard|blk|block|close|crescent|drive|dr|lane|link|place|road|rd|street|st|terrace|view|walk|way)\b/i;

const repeatedCharacterPattern = /^([A-Za-z0-9])\1+$/;
const sequentialPostalCodes = new Set(["012345", "123456", "234567", "345678", "456789", "987654", "876543"]);

function containsLongUnpronounceableToken(value: string) {
  return value
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .some((token) => token.length >= 5 && !/[aeiou]/i.test(token));
}

function looksLikePlaceholderText(value: string) {
  const compact = value.replace(/[^A-Za-z0-9]/g, "");

  return compact.length > 0 && repeatedCharacterPattern.test(compact);
}

export function validateHouseholdAddressLine1(value: string) {
  const trimmedAddress = value.trim();

  if (!trimmedAddress) {
    return householdValidationMessages.addressRequired;
  }

  if (trimmedAddress.length < 5) {
    return householdValidationMessages.addressTooShort;
  }

  if (!/\d/.test(trimmedAddress) || !/[A-Za-z]/.test(trimmedAddress)) {
    return householdValidationMessages.addressNeedsNumberAndName;
  }

  if (!streetTypePattern.test(trimmedAddress)) {
    return householdValidationMessages.addressNeedsStreetType;
  }

  if (looksLikePlaceholderText(trimmedAddress) || containsLongUnpronounceableToken(trimmedAddress)) {
    return householdValidationMessages.addressLooksInvalid;
  }

  return "";
}

export function validateOptionalAddressLine2(value?: string) {
  const trimmedAddressDetails = value?.trim() ?? "";

  if (!trimmedAddressDetails) {
    return "";
  }

  if (looksLikePlaceholderText(trimmedAddressDetails) || containsLongUnpronounceableToken(trimmedAddressDetails)) {
    return householdValidationMessages.addressDetailsLookInvalid;
  }

  return "";
}

export function validateOptionalUnitNumber(value?: string) {
  const trimmedUnit = value?.trim() ?? "";

  if (!trimmedUnit) {
    return "";
  }

  if (!/^#[A-Za-z0-9]{2,3}-[A-Za-z0-9]{2,5}$/.test(trimmedUnit)) {
    return householdValidationMessages.unitInvalid;
  }

  return "";
}

export function validateOptionalPostalCode(value?: string) {
  const trimmedPostalCode = value?.trim() ?? "";

  if (!trimmedPostalCode) {
    return "";
  }

  if (!/^\d{6}$/.test(trimmedPostalCode)) {
    return householdValidationMessages.postalInvalid;
  }

  if (repeatedCharacterPattern.test(trimmedPostalCode) || sequentialPostalCodes.has(trimmedPostalCode)) {
    return householdValidationMessages.postalPlaceholder;
  }

  return "";
}

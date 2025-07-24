/**
 * Utility function to format FHIR address data into a human-readable string
 * Following medical/healthcare industry standards for address formatting
 * 
 * @param {Object} address - FHIR Address object
 * @returns {string} - Formatted address string
 */
export const formatAddressText = (address) => {
  if (!address) return '';
  
  const parts = [];
  
  // Add street address lines (e.g., "123 Main St, Apt 4B")
  if (address.line && address.line.length > 0) {
    const streetLines = address.line.filter(line => line && line.trim());
    if (streetLines.length > 0) {
      parts.push(streetLines.join(', '));
    }
  }
  
  // Add city, state/province, postal code in standard format
  const cityStateParts = [];
  if (address.city && address.city.trim()) {
    cityStateParts.push(address.city.trim());
  }
  
  // Add state/province and postal code together 
  // Examples: "ON M5V 3A8" (Canada), "CA 90210" (US), "NSW 2000" (Australia)
  const statePostalParts = [];
  if (address.state && address.state.trim()) {
    statePostalParts.push(address.state.trim());
  }
  if (address.postalCode && address.postalCode.trim()) {
    statePostalParts.push(address.postalCode.trim());
  }
  
  if (statePostalParts.length > 0) {
    cityStateParts.push(statePostalParts.join(' '));
  }
  
  if (cityStateParts.length > 0) {
    parts.push(cityStateParts.join(', '));
  }
  
  // Add country if specified and not empty
  if (address.country && address.country.trim()) {
    parts.push(address.country.trim());
  }
  
  return parts.join(', ');
};

/**
 * Creates a complete FHIR address object with auto-generated formatted text
 * 
 * @param {Object} addressData - Raw address data
 * @returns {Object} - Complete FHIR Address object with formatted text
 */
export const createFormattedAddress = (addressData) => {
  if (!addressData) return undefined;
  
  const address = {
    use: addressData.use || 'home',
    type: addressData.type || 'physical',
    line: addressData.line || [],
    city: addressData.city || '',
    district: addressData.district || '',
    state: addressData.state || '',
    postalCode: addressData.postalCode || '',
    country: addressData.country || '',
  };
  
  // Auto-generate the formatted text
  address.text = formatAddressText(address);
  
  return address;
};
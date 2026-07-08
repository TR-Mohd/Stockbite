export const capitalize = (str) => {
  if (typeof str !== 'string' || !str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone, hasContactPerson) => {
  if (!phone) return '';
  
  // Extract all digits
  let digits = phone.replace(/\D/g, '');
  
  // Remove leading 62
  if (digits.startsWith('62')) {
    digits = digits.substring(2);
  }
  
  // Remove leading 0
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  if (!digits) return phone;
  
  // Limit to maximum 11 digits after country code
  digits = digits.substring(0, 11);
  
  if (hasContactPerson) {
    // Format: +62 8xx-xxxx-xxxx
    const p1 = digits.substring(0, 3);
    const p2 = digits.substring(3, 7);
    const p3 = digits.substring(7);
    
    let result = `+62 ${p1}`;
    if (p2) result += `-${p2}`;
    if (p3) result += `-${p3}`;
    return result;
  } else {
    // Format: +62 xx xxxx-xxxx
    const p1 = digits.substring(0, 2);
    const p2 = digits.substring(2, 6);
    const p3 = digits.substring(6);
    
    let result = `+62 ${p1}`;
    if (p2) result += ` ${p2}`;
    if (p3) result += `-${p3}`;
    return result;
  }
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDateStandard = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  
  return `${month} ${day}, ${hoursStr}:${minutes} ${ampm}`;
};

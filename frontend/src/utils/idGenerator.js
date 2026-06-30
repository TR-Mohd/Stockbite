export const generateSupplierId = (coverage, regionCode, currentSuppliers) => {
  const hub = coverage === 'National' ? 'NAT' : regionCode;
  const year = new Date().getFullYear().toString().slice(-2);
  const regex = /^SUP-([A-Z]{3})-(\d{2})(\d{3})$/;
  
  let maxSeq = 99;
  currentSuppliers.forEach(supplier => {
    const match = supplier.id?.match(regex);
    if (match) {
      const [, suppHub, suppYear, suppSeq] = match;
      if (suppHub === hub && suppYear === year) {
        const seq = parseInt(suppSeq, 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });
  
  return `SUP-${hub}-${year}${(maxSeq + 1).toString().padStart(3, '0')}`;
};

export const generateEmployeeId = (role, currentEmployees) => {
  const roleMap = {
    'Manager': 'MGR',
    'Cashier': 'CSH',
    'Warehouse': 'WHS'
  };
  const roleCode = roleMap[role] || (role ? role.substring(0, 3).toUpperCase() : 'UNK');
  const year = new Date().getFullYear().toString().slice(-2);
  const regex = /^EMP-([A-Z]{3})-(\d{2})(\d{3})$/;

  let maxSeq = 99;
  currentEmployees.forEach(employee => {
    const match = employee.id?.match(regex);
    if (match) {
      const [, empRole, empYear, empSeq] = match;
      if (empYear === year) {
        const seq = parseInt(empSeq, 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  return `EMP-${roleCode}-${year}${(maxSeq + 1).toString().padStart(3, '0')}`;
};

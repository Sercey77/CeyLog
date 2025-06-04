interface HTSMapping {
  code: string;
  description: string;
  importDuty: number;
  vat: number;
  exemptions: string[];
  notes: string;
}

export const HTS_MAPPINGS: Record<string, HTSMapping> = {
  // Electronics
  '8517.12.00': {
    code: '8517.12.00',
    description: 'Telephone sets, including smartphones',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },
  '8517.62.00': {
    code: '8517.62.00',
    description: 'Base stations for mobile phones',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },

  // Textiles
  '6104.42.00': {
    code: '6104.42.00',
    description: 'Women\'s or girls\' suits, of cotton',
    importDuty: 12,
    vat: 20,
    exemptions: [],
    notes: 'Standard rate applies'
  },
  '6204.32.90': {
    code: '6204.32.90',
    description: 'Women\'s or girls\' suits, of cotton',
    importDuty: 12,
    vat: 20,
    exemptions: [],
    notes: 'Standard rate applies'
  },

  // Furniture
  '9401.61.00': {
    code: '9401.61.00',
    description: 'Seats with wooden frames, upholstered',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },
  '9403.20.00': {
    code: '9403.20.00',
    description: 'Other wooden furniture',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },

  // Machinery
  '8471.30.00': {
    code: '8471.30.00',
    description: 'Portable automatic data processing machines',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },
  '8421.21.00': {
    code: '8421.21.00',
    description: 'Filtering or purifying machinery for liquids',
    importDuty: 0,
    vat: 20,
    exemptions: ['UK-EU Trade Agreement'],
    notes: 'No import duty for EU imports'
  },

  // Chemicals
  '3402.20.10': {
    code: '3402.20.10',
    description: 'Organic surface-active agents',
    importDuty: 6.5,
    vat: 20,
    exemptions: [],
    notes: 'Standard rate applies'
  },
  '3402.90.00': {
    code: '3402.90.00',
    description: 'Other organic surface-active agents',
    importDuty: 6.5,
    vat: 20,
    exemptions: [],
    notes: 'Standard rate applies'
  }
};

export function findHTSMapping(category: string, description: string): HTSMapping | null {
  // This is a simplified matching function
  // In a real application, you would want to use a more sophisticated matching algorithm
  const keywords = [...category.toLowerCase().split(' '), ...description.toLowerCase().split(' ')];
  
  for (const [code, mapping] of Object.entries(HTS_MAPPINGS)) {
    const mappingKeywords = mapping.description.toLowerCase().split(' ');
    const matchScore = keywords.filter(keyword => 
      mappingKeywords.some(mappingKeyword => mappingKeyword.includes(keyword))
    ).length;
    
    if (matchScore >= 2) { // Require at least 2 keyword matches
      return mapping;
    }
  }
  
  return null;
}

export function getDefaultHTSMapping(): HTSMapping {
  return {
    code: '0000.00.00',
    description: 'Unspecified goods',
    importDuty: 0,
    vat: 20,
    exemptions: [],
    notes: 'Please consult HMRC for accurate classification'
  };
} 
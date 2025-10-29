export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateRequired = (value) => value && value.toString().trim().length > 0;

export const validateGrade = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 20;
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    fieldRules.forEach(rule => {
      if (rule.type === 'required' && !validateRequired(value)) {
        errors[field] = rule.message || `${field} est requis`;
      }
      if (rule.type === 'email' && value && !validateEmail(value)) {
        errors[field] = rule.message || 'Email invalide';
      }
      if (rule.type === 'grade' && value && !validateGrade(value)) {
        errors[field] = rule.message || 'Note entre 0 et 20';
      }
    });
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
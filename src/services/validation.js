export function validateJavaScript(code) {
  try {
    new Function(code);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function validateJson(code) {
  try {
    JSON.parse(code);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function validate(code, language) {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return validateJavaScript(code);
    case 'json':
      return validateJson(code);
    default:
      return { valid: true, skipped: true };
  }
}

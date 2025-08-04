

import { PasswordValidator } from 'password-validator-pro';

const validator = new PasswordValidator({
  minLength: 8,                // Minimum length of the password
  maxLength: 20,               // Maximum length of the password
  requireUppercase: true,      // Require at least one uppercase letter
  requireLowercase: true,      // Require at least one lowercase letter
  requireNumbers: true,        // Require at least one number
  requireSpecialChars: true,   // Require at least one special character
  combineErrors: false,        // Set this to true to combine all errors into one message
});

export{validator}

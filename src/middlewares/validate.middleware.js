// src/middlewares/validate.middleware.js
const { errorResponse } = require('../utils/apiResponse');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Siapkan objek data yang akan divalidasi
      const dataToValidate = {
        body: req.body || {}, // Default empty object jika undefined
        query: req.query || {},
        params: req.params || {},
      };

      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const firstError = result.error.issues ? result.error.issues[0] : result.error.errors?.[0];
        
        if (firstError) {
          return errorResponse(res, 400, `Validation Failed: ${firstError.message}`);
        } else {
          return errorResponse(res, 400, 'Validation Failed: Invalid input format');
        }
      }

      // Simpan hasil transformasi (misal: page string -> int) ke req.validatedData
      req.validatedData = result.data;
      
      next();
    } catch (error) {
      console.error('Validation Middleware Error:', error);
      return errorResponse(res, 500, 'Internal Server Error in Validation');
    }
  };
};

module.exports = { validateRequest };
// src/middlewares/validate.middleware.js
const { errorResponse } = require('../utils/apiResponse');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const firstError = result.error.issues ? result.error.issues[0] : result.error.errors?.[0];
        
        if (firstError) {
          return errorResponse(res, 400, `Validasi Gagal: ${firstError.message}`);
        } else {
          return errorResponse(res, 400, 'Validasi Gagal: Format input tidak sesuai');
        }
      }

      // PENTING: Simpan hasil transformasi ke req.validatedData
      req.validatedData = result.data;
      
      next();
    } catch (error) {
      console.error('Validation Middleware Error:', error);
      return errorResponse(res, 500, 'Internal Server Error pada Validasi');
    }
  };
};

module.exports = { validateRequest };
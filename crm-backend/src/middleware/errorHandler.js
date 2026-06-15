exports.errorHandler = (err, req, res, next) => {
  console.error("Express Error Middleware triggered:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

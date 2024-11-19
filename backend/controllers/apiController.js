//src/controllers/apiController.js
exports.getData = (req, res) => {
  const endpoint = req.path.includes('safe') ? 'Safe Endpoint' : 'Unsafe Endpoint';
  res.json({ 
      success: true,
      message: `Request successful from ${endpoint}`, 
      data: "Your data has been retrieved successfully",
      timestamp: new Date().toISOString()
  });
};

exports.healthCheck = (req, res) => {
  res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString()
  });
};
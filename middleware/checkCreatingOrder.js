function checkOrderInProgress(req, res, next) {

    const { isCreatingOrder } = req.session;
  
    // Check if the user's session is locked for order creation
    if (isCreatingOrder) {
      return res.status(403).json({ message: 'An order is already being created.' });
    }
      
    next();
  }
  
  module.exports = checkOrderInProgress;
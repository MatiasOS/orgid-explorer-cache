const { findByAddress } = require('../db/permanent/models/snapshot');


const getList = async function(req, res, next) {
  next();
};

const getDetail = async function(req, res, next) {
  try {
    const orgAddress = req.params.orgAddress;
    const organization = await findByAddress(orgAddress);
    if (organization) {
      res.status(200).json(organization);
    } else {
      res.status(404);
    }
    next();
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getList,
  getDetail,
};

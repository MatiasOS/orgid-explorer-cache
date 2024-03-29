const { findAllCurrent, findByAddress } = require('../db/permanent/models/snapshot');

const getList = async function (req, res, next) {
  try {
    if (req.query.sortByDistance && req.query.sortingField) {
      res.status(400).json({ message: 'Can\'t sort by both distance and fields.' });
    } else {
      const sortBy = req.query.sortingField;
      const { items, totalCount } = await findAllCurrent(req.query, sortBy);
      res.status(200).json({ items, totalCount });
    }
  } catch (e) {
    next(e);
  }
};

const getDetail = async function (req, res, next) {
  try {
    const orgAddress = req.params.orgAddress;
    const organization = await findByAddress(orgAddress);
    if (organization) {
      res.status(200).json(organization);
    } else {
      res.status(404).send('Don\'t know about any ORG.ID on that address. Maybe it\'s not cached yet? Try ' +
        '<a href="https://debugging-tools.windingtree.com/debugger">index-debugger</a> for live data.');
    }
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getList,
  getDetail,
};

const express = require('express');
const router = express.Router();
const ConstController = require('../controllers/ConstController');

module.exports = (app) => {
    app.use('/const', router);
};

router.post('/refleshTables', ConstController.refleshTables);
router.post('/listTables', ConstController.getTableList);


const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/AccountController');

module.exports = (app) => {
    app.use('/account', router);
};

router.post('/Login', AccountController.Login);


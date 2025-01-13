const express = require('express');
const { register, login } = require('../controllers/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', register);

// POST /auth/login
router.post('/login', login);

module.exports = router;

// Vercel Serverless Entry Point for 7BLOCKS CRM API
// This file is the single handler for all requests routed via vercel.json
const app = require('../dist/server.js').default || require('../dist/server.js');

module.exports = app;

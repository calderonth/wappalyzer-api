const express = require('express');
const Wappalyzer = require('wappalyzer');
const router = express.Router();

const options = {
  browser: 'zombie',
  debug: false,
  delay: 500,
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

/* GET simple lookup. */
router.get('/v1/', function(req, res) {
  let { query: { url } } = req;
  if (url) {
    new Wappalyzer(url, options).analyze().then(json => res.send(json)).catch(error => res.status(500).send(error))
  } else {
    res.status(500).send(`URL is required`);
  }
});

module.exports = router;

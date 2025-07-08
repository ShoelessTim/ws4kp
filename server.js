const express = require('express');
const fetch = require('node-fetch');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache();

// Serve static files from repo root
app.use(express.static(__dirname));

const allowedHosts = new Set([
  'forecast.weather.gov',
  'api.weather.gov',
  'api.weather.com',
  'www.aviationweather.gov',
  'aviationweather.gov',
  'www.wunderground.com',
  'api-ak.wunderground.com',
  'tidesandcurrents.noaa.gov',
  'l-36.com',
  'airquality.weather.gov',
  'airnow.gov',
  'www.airnowapi.org',
  'www2.ehs.niu.edu',
  'alerts.weather.gov',
  'mesonet.agron.iastate.edu',
  'tgftp.nws.noaa.gov',
  'www.cpc.ncep.noaa.gov',
  'api.usno.navy.mil',
  'radar.weather.gov'
]);

const ttlMap = {
  'alerts.weather.gov': 300,
  'www.aviationweather.gov': 300,
  'aviationweather.gov': 300,
  'mesonet.agron.iastate.edu': 300,
  'radar.weather.gov': 300,
  'www2.ehs.niu.edu': 300,
  'tidesandcurrents.noaa.gov': 10800,
  'l-36.com': 10800,
  'airquality.weather.gov': 10800,
  'airnow.gov': 10800,
  'www.airnowapi.org': 10800,
  'tgftp.nws.noaa.gov': 10800,
  'www.cpc.ncep.noaa.gov': 10800,
  'api.usno.navy.mil': 10800
};

app.get('/cors', async (req, res) => {
  const url = req.query.u;
  if (!url) {
    res.status(400).send('Missing url');
    return;
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    res.status(400).send('Invalid url');
    return;
  }
  if (!allowedHosts.has(parsed.hostname.toLowerCase()) && !url.endsWith('?rss=1')) {
    res.status(403).send('Forbidden');
    return;
  }
  const cached = cache.get(url);
  if (cached) {
    res.type(cached.type).send(cached.body);
    return;
  }
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      res.status(response.status).send(response.statusText);
      return;
    }
    const buffer = await response.buffer();
    const type = response.headers.get('content-type') || 'application/octet-stream';
    res.type(type).send(buffer);
    const ttl = ttlMap[parsed.hostname.toLowerCase()] || 3600;
    cache.set(url, { body: buffer, type }, ttl);
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

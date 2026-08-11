const express = require('express');

const app = express();

// The only route: a health check the pipeline uses to verify the deploy.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Only start listening when run directly (so tests can import the app).
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on ${port}`));
}

module.exports = app;

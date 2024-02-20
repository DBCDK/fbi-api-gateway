export default function handler(req, res) {
  const { code } = req.body;
  const decoded = Buffer.from(code, "base64").toString();

  res.status(200).json({
    access_token: decoded,
    expires_at: Math.round(Date.now() / 1000 + 60 * 60 * 24 * 30),
  });
}

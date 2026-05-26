// src/services/googleAuth.service.js
const { OAuth2Client } = require('google-auth-library');
const config = require('../config/env');

let client = null;

function getGoogleClient() {
  if (!config.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi');
  }
  if (!client) {
    client = new OAuth2Client(config.googleClientId);
  }
  return client;
}

async function verifyGoogleCredential(credential) {
  const googleClient = getGoogleClient();
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Token Google tidak valid');
  }

  if (!payload.email_verified) {
    throw new Error('Email Google belum diverifikasi');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || null,
  };
}

module.exports = { verifyGoogleCredential };

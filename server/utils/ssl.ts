/**
 * SSL Certificate Utilities
 *
 * Generates self-signed certificates for local HTTPS development.
 * Uses node-forge for reliable certificate generation.
 */

import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificate storage directory
const CERTS_DIR = path.join(__dirname, '../../.certs');
const KEY_PATH = path.join(CERTS_DIR, 'localhost.key');
const CERT_PATH = path.join(CERTS_DIR, 'localhost.crt');

export interface SSLCert {
  key: string;
  cert: string;
}

/**
 * Generate a self-signed certificate using node-forge
 */
export function generateSelfSignedCert(): SSLCert {
  // Check if certificates already exist and are valid
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    try {
      const key = fs.readFileSync(KEY_PATH, 'utf-8');
      const cert = fs.readFileSync(CERT_PATH, 'utf-8');
      // Basic validation - check if they look like valid PEM files
      if (key.includes('-----BEGIN') && cert.includes('-----BEGIN CERTIFICATE-----')) {
        console.log('[SSL] Using existing certificates');
        return { key, cert };
      }
    } catch {
      // Invalid certs, will regenerate
    }
  }

  // Create certs directory
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  console.log('[SSL] Generating self-signed certificate...');

  // Generate a key pair
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Create a certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(8));

  // Set validity (1 year)
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  // Set subject and issuer (self-signed)
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'organizationName', value: 'FluidFlow Development' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Set extensions
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' }, // DNS
        { type: 7, ip: '127.0.0.1' }, // IP
      ],
    },
  ]);

  // Sign the certificate with the private key
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert to PEM format
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  // Save certificates to disk
  fs.writeFileSync(KEY_PATH, privateKeyPem);
  fs.writeFileSync(CERT_PATH, certPem);

  console.log('[SSL] Certificate generated successfully');

  return { key: privateKeyPem, cert: certPem };
}

/**
 * Check if valid certificates exist
 */
export function hasCertificates(): boolean {
  return fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);
}

/**
 * Get certificate paths
 */
export function getCertPaths(): { keyPath: string; certPath: string } {
  return { keyPath: KEY_PATH, certPath: CERT_PATH };
}

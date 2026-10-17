#!/usr/bin/env node
// ============================================================
// backend/tests/media.test.js
// Automated Media Library & Upload Integration Tests
// ============================================================

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const fs = require('fs');
const jwt = require('jsonwebtoken');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
    failures.push(label);
  }
}

function section(name) {
  console.log(`\n── ${name}`);
}

function summary() {
  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\nFailed assertions:');
    failures.forEach((f) => console.log(`  • ${f}`));
  }
  console.log('─'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

// Generate valid JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';
const adminToken = jwt.sign({ id: 'test-admin-id', email: 'admin@test.com', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: 'test-user-id', email: 'user@test.com', role: 'USER' }, JWT_SECRET, { expiresIn: '1h' });

// Generic HTTP request helper
function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      hostname: 'localhost',
      port: 3001,
      ...options,
    };

    const req = http.request(defaultHeaders, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body, json });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Multipart builder helper
function buildMultipart(fields, file) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const crlf = '\r\n';
  let bufferList = [];

  for (const [key, value] of Object.entries(fields)) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${key}"${crlf}${crlf}`;
    part += `${value}${crlf}`;
    bufferList.push(Buffer.from(part, 'utf8'));
  }

  if (file) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"${crlf}`;
    part += `Content-Type: ${file.contentType}${crlf}${crlf}`;
    bufferList.push(Buffer.from(part, 'utf8'));
    bufferList.push(file.content);
    bufferList.push(Buffer.from(crlf, 'utf8'));
  }

  bufferList.push(Buffer.from(`--${boundary}--${crlf}`, 'utf8'));

  const fullBuffer = Buffer.concat(bufferList);
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body: fullBuffer,
  };
}

// Minimal 1x1 WebP dummy image buffer
const sampleWebpBuffer = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
  0x0e, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
  0x10, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0xfe,
  0x07, 0x00
]);

async function runTests() {
  console.log('Starting Media Library & Upload API integration test suite...\n');

  // 1. AUTH GUARDS
  section('1. Authentication & Role Protection');

  const noAuthGet = await request({
    path: '/api/media',
    method: 'GET',
  });
  assert(noAuthGet.statusCode === 401, 'GET /api/media without token returns 401 Unauthorized');

  const userAuthGet = await request({
    path: '/api/media',
    method: 'GET',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(userAuthGet.statusCode === 403, 'GET /api/media with non-admin role returns 403 Forbidden');

  const noAuthUpload = await request({
    path: '/api/media/upload',
    method: 'POST',
  });
  assert(noAuthUpload.statusCode === 401, 'POST /api/media/upload without token returns 401 Unauthorized');

  // 2. ADMIN UPLOAD FUNCTIONALITY
  section('2. Admin Image Upload & Metadata Extraction');

  const uploadPayload = buildMultipart(
    {
      category: 'vehicles',
      altText: 'Test Innova Crysta at Pune Station',
      title: 'Innova Crysta Test Unit',
    },
    {
      fieldname: 'file',
      filename: 'test-innova.webp',
      contentType: 'image/webp',
      content: sampleWebpBuffer,
    }
  );

  const uploadRes = await request(
    {
      path: '/api/media/upload',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': uploadPayload.contentType,
        'Content-Length': uploadPayload.body.length,
      },
    },
    uploadPayload.body
  );

  assert(uploadRes.statusCode === 201, `Upload returns HTTP 201 Created (got ${uploadRes.statusCode})`);
  assert(uploadRes.json?.success === true, 'Upload response has success: true');
  assert(uploadRes.json?.data?.id !== undefined, 'Upload returned asset database ID');
  assert(uploadRes.json?.data?.category === 'vehicles', 'Asset category recorded as "vehicles"');
  assert(uploadRes.json?.data?.altText === 'Test Innova Crysta at Pune Station', 'Alt text recorded accurately in database');
  assert(uploadRes.json?.data?.url?.startsWith('/uploads/vehicles/'), `Public URL is correctly namespaced (${uploadRes.json?.data?.url})`);

  const createdAssetId = uploadRes.json?.data?.id;
  const createdAssetUrl = uploadRes.json?.data?.url;

  // Verify file was written to disk
  if (createdAssetUrl) {
    const rootUploads = path.resolve(__dirname, '../uploads');
    const diskPath = path.resolve(rootUploads, createdAssetUrl.replace(/^\/uploads\//, ''));
    assert(fs.existsSync(diskPath), `Physical file exists on server disk at ${diskPath}`);
  }

  // 3. MEDIA ASSET LISTING & FILTERING
  section('3. Media Asset Listing, Search & Category Filters');

  const listRes = await request({
    path: '/api/media?category=vehicles',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert(listRes.statusCode === 200, 'GET /api/media returns HTTP 200');
  assert(Array.isArray(listRes.json?.data), 'Response data is an array of media assets');
  assert(listRes.json?.pagination?.total >= 1, 'Pagination total count reflects uploaded assets');

  const foundItem = listRes.json?.data?.find((a) => a.id === createdAssetId);
  assert(Boolean(foundItem), 'Created asset is found in category filtered list');

  // Search filter test
  const searchRes = await request({
    path: '/api/media?search=Innova',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    searchRes.json?.data?.some((a) => a.id === createdAssetId),
    'Search filter matches asset by title/altText keyword'
  );

  // 4. METADATA UPDATE
  section('4. Editable Alt Text & Category Updates');

  const updateBody = JSON.stringify({
    altText: 'Updated Alt Text for Executive Sedan',
    title: 'Executive Sedan Refined',
    category: 'general',
  });

  const updateRes = await request(
    {
      path: `/api/media/${createdAssetId}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updateBody),
      },
    },
    updateBody
  );

  assert(updateRes.statusCode === 200, 'PUT /api/media/:id returns HTTP 200');
  assert(updateRes.json?.data?.altText === 'Updated Alt Text for Executive Sedan', 'Alt text updated in database');
  assert(updateRes.json?.data?.category === 'general', 'Category updated in database');

  // 5. VEHICLE IMAGE UPLOAD BACKWARD COMPATIBILITY
  section('5. Vehicle Image Upload Endpoint Backwards Compatibility');

  const vehicleUploadPayload = buildMultipart(
    {},
    {
      fieldname: 'image',
      filename: 'legacy-vehicle.png',
      contentType: 'image/png',
      content: sampleWebpBuffer,
    }
  );

  const vehicleUploadRes = await request(
    {
      path: '/api/vehicles/upload-image',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': vehicleUploadPayload.contentType,
        'Content-Length': vehicleUploadPayload.body.length,
      },
    },
    vehicleUploadPayload.body
  );

  assert(vehicleUploadRes.statusCode === 200, 'Legacy /api/vehicles/upload-image returns HTTP 200');
  assert(vehicleUploadRes.json?.success === true, 'Response returns success: true');
  assert(typeof vehicleUploadRes.json?.imageUrl === 'string', 'Response returns imageUrl property for existing consumers');
  assert(vehicleUploadRes.json?.imageUrl?.startsWith('/uploads/vehicles/'), 'Legacy vehicle image saved under /uploads/vehicles/');

  // 6. SAFE DELETION
  section('6. Asset Deletion & Disk Cleanup');

  if (createdAssetId) {
    const deleteRes = await request({
      path: `/api/media/${createdAssetId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(deleteRes.statusCode === 200, 'DELETE /api/media/:id returns HTTP 200 OK');
    assert(deleteRes.json?.success === true, 'Delete response confirms success: true');

    // Verify deleted from DB
    const checkRes = await request({
      path: `/api/media/${createdAssetId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(checkRes.statusCode === 404, 'Deleted asset is no longer accessible (HTTP 404)');
  }

  summary();
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

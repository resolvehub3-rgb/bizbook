import test from 'node:test';
import assert from 'node:assert/strict';
import { isSuperAdmin, SUPER_ADMIN_EMAIL, SUPER_ADMIN_DEFAULT_PASS } from './admin';

test('isSuperAdmin correctly identifies super-admin email', () => {
  assert.equal(isSuperAdmin('bizbook@gmail.com'), true);
  assert.equal(isSuperAdmin('BIZBOOK@GMAIL.COM'), true);
  assert.equal(isSuperAdmin('  bizbook@gmail.com  '), true);
});

test('isSuperAdmin rejects non-admin emails', () => {
  assert.equal(isSuperAdmin('other@gmail.com'), false);
  assert.equal(isSuperAdmin('admin@bizbook.com'), false);
  assert.equal(isSuperAdmin(''), false);
  assert.equal(isSuperAdmin(null), false);
  assert.equal(isSuperAdmin(undefined), false);
});

test('Super admin constants are properly set', () => {
  assert.equal(SUPER_ADMIN_EMAIL, 'bizbook@gmail.com');
  assert.equal(SUPER_ADMIN_DEFAULT_PASS, 'GoodGod1$');
});

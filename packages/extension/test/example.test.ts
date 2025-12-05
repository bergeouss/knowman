import { describe, expect, test } from 'bun:test';

describe('Extension example tests', () => {
  test('basic test', () => {
    expect(1 + 2).toBe(3);
  });

  test('string test', () => {
    expect('extension').toContain('ext');
  });
});
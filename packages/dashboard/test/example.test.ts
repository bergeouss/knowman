import { describe, expect, test } from 'bun:test';

describe('Dashboard example tests', () => {
  test('basic math', () => {
    expect(2 * 2).toBe(4);
  });

  test('string length', () => {
    expect('hello'.length).toBe(5);
  });
});
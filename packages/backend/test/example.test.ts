import { describe, expect, test } from 'bun:test';

describe('Example test suite', () => {
  test('addition works', () => {
    expect(1 + 1).toBe(2);
  });

  test('string concatenation', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
});
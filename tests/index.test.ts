import * as ccem from '@/index';

describe('CCEM Main Module', () => {
  it('should export schema validation functions', () => {
    expect(ccem.validateSchema).toBeDefined();
    expect(typeof ccem.validateSchema).toBe('function');
  });

  it('should export ValidationError', () => {
    expect(ccem.ValidationError).toBeDefined();
  });

  it('should export schema definitions', () => {
    expect(ccem.tuiStructureSchema).toBeDefined();
    expect(ccem.menuTypeSchema).toBeDefined();
  });
});

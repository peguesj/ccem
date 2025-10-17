import * as schemaModule from '@/schema';

describe('Schema Module Exports', () => {
  it('should export validateSchema function', () => {
    expect(schemaModule.validateSchema).toBeDefined();
    expect(typeof schemaModule.validateSchema).toBe('function');
  });

  it('should export ValidationError class', () => {
    expect(schemaModule.ValidationError).toBeDefined();
  });

  it('should export tuiStructureSchema', () => {
    expect(schemaModule.tuiStructureSchema).toBeDefined();
  });

  it('should export menuTypeSchema', () => {
    expect(schemaModule.menuTypeSchema).toBeDefined();
  });
});

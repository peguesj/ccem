import { tuiStructureSchema, menuTypeSchema } from '@/schema/definitions';

describe('Schema Definitions', () => {
  describe('menuTypeSchema', () => {
    it('should accept valid menu types', () => {
      expect(() => menuTypeSchema.parse('root')).not.toThrow();
      expect(() => menuTypeSchema.parse('submenu')).not.toThrow();
      expect(() => menuTypeSchema.parse('action')).not.toThrow();
      expect(() => menuTypeSchema.parse('view')).not.toThrow();
    });

    it('should reject invalid menu types', () => {
      expect(() => menuTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('tuiStructureSchema edge cases', () => {
    it('should handle null parent_id', () => {
      const schema = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Root Menu',
        type: 'root' as const,
        parent_id: null
      };

      expect(() => tuiStructureSchema.parse(schema)).not.toThrow();
    });

    it('should validate order as non-negative integer', () => {
      const schema = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Menu',
        type: 'root' as const,
        order: -1
      };

      expect(() => tuiStructureSchema.parse(schema)).toThrow();
    });
  });
});

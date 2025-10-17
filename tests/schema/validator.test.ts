import { validateSchema } from '@/schema/validator';
import { tuiStructureSchema } from '@/schema/definitions';

describe('Schema Validator', () => {
  describe('TUI Structure Validation', () => {
    it('should validate correct TUI structure', () => {
      const validSchema = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Menu',
        type: 'root' as const,
      };

      expect(() => validateSchema(validSchema, tuiStructureSchema)).not.toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidSchema = {
        id: 'not-a-uuid',
        title: 'Test Menu',
        type: 'root' as const,
      };

      expect(() => validateSchema(invalidSchema, tuiStructureSchema)).toThrow(/Invalid UUID/);
    });

    it('should require mandatory fields', () => {
      const missingFields = {
        id: '00000000-0000-0000-0000-000000000000',
      };

      expect(() => validateSchema(missingFields, tuiStructureSchema)).toThrow();
    });

    it('should validate optional fields when present', () => {
      const withOptional = {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Menu',
        type: 'root' as const,
        parent_id: '11111111-1111-1111-1111-111111111111',
        icon: '🎯',
        description: 'Test description',
        shortcut: '1',
        order: 0,
      };

      expect(() => validateSchema(withOptional, tuiStructureSchema)).not.toThrow();
    });
  });

  describe('Error Reporting', () => {
    it('should provide detailed error messages', () => {
      const invalid = {
        id: 'bad-uuid',
        title: '',
        type: 'invalid',
      };

      try {
        validateSchema(invalid, tuiStructureSchema);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error).toHaveProperty('errors');
        expect(error.errors).toBeInstanceOf(Array);
        expect(error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should rethrow non-ZodError errors', () => {
      const customError = new Error('Custom error');
      const throwingSchema = {
        parse: () => {
          throw customError;
        },
      } as any;

      expect(() => validateSchema({}, throwingSchema)).toThrow('Custom error');
    });
  });
});

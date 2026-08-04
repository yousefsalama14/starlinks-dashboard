import {
  TableFilterField,
  TableFilterModel,
  TableMultipleSelectFilterField,
  TableSingleSelectFilterField,
} from './table-toolbar.types';

const SUPPORTED_KINDS = new Set(['text', 'date', 'single-select', 'multiple-select']);

export function validateTableFilterFields(
  fields: readonly TableFilterField[],
): readonly TableFilterField[] {
  const keys = new Set<string>();
  fields.forEach((field, index) => {
    if (typeof field.key !== 'string' || field.key.trim().length === 0) {
      throw new Error(`[TableFilters] Invalid field key at index ${index}: ${String(field.key)}`);
    }
    if (keys.has(field.key)) {
      throw new Error(`[TableFilters] Duplicate field key "${field.key}" at index ${index}.`);
    }
    if (!SUPPORTED_KINDS.has(field.kind)) {
      throw new Error(
        `[TableFilters] Unsupported field kind "${String(field.kind)}" for "${field.key}".`,
      );
    }
    if (field.kind === 'single-select' || field.kind === 'multiple-select') {
      validateOptions(field);
    }
    keys.add(field.key);
  });
  return fields;
}

export function validateTableFilterDraft(
  draft: TableFilterModel,
  fields: readonly TableFilterField[],
): TableFilterModel {
  fields.forEach((field) => {
    const value = draft[field.key];
    if (value === undefined) {
      return;
    }
    const valid =
      field.kind === 'multiple-select'
        ? Array.isArray(value) && value.every((item) => typeof item === 'string')
        : value === null || typeof value === 'string';
    if (!valid) {
      throw new Error(
        `[TableFilters] Invalid draft value type for field "${field.key}" (${field.kind}).`,
      );
    }
  });
  return draft;
}

export function validateTableFilterActiveCount(value: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`[TableFilters] activeCount must be a finite non-negative integer: ${value}`);
  }
  return value;
}

function validateOptions(
  field: TableSingleSelectFilterField | TableMultipleSelectFilterField,
): void {
  if (field.options.length === 0) {
    throw new Error(
      `[TableFilters] Select field "${field.key}" must configure at least one option.`,
    );
  }
  const values = new Set<string>();
  field.options.forEach((option, index) => {
    validateOptionValue(field.key, option.value, index, values);
  });
  if (field.kind === 'single-select' && field.clearOption) {
    validateOptionValue(field.key, field.clearOption.value, 'clear', values);
  }
}

function validateOptionValue(
  fieldKey: string,
  value: string,
  index: number | 'clear',
  values: Set<string>,
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`[TableFilters] Invalid option value in field "${fieldKey}" at ${index}.`);
  }
  if (values.has(value)) {
    throw new Error(`[TableFilters] Duplicate option value "${value}" in field "${fieldKey}".`);
  }
  values.add(value);
}

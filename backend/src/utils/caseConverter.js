/**
 * Convierte un string de snake_case a camelCase
 * Ejemplo: ot_id -> otId, subtotal_calc -> subtotalCalc
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convierte un string de camelCase a snake_case
 * Ejemplo: otId -> ot_id, subtotalCalc -> subtotal_calc
 */
export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transforma recursivamente las claves de un objeto o arreglo de snake_case a camelCase
 */
export function toCamelCase(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => toCamelCase(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = toCamelCase(value);
    }
    return result;
  }

  return data;
}

/**
 * Transforma recursivamente las claves de un objeto de camelCase a snake_case
 */
export function toSnakeCase(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => toSnakeCase(item));
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = toSnakeCase(value);
    }
    return result;
  }

  return data;
}

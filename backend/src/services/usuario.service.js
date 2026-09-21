import * as usuarioModel from '../models/usuario.model.js';
import { toCamelCase } from '../utils/caseConverter.js';

export async function getUsuariosList() {
  const rows = await usuarioModel.findAll();
  return rows.map(row => toCamelCase(row));
}

export async function getUsuarioByEmail(email) {
  const row = await usuarioModel.findByEmail(email);
  return row ? toCamelCase(row) : null;
}

export async function createUsuario(data) {
  const email = data.email;
  const nombre = data.nombre;
  const rol = data.rol || 'recepcion';

  const row = await usuarioModel.insert({ email, nombre, rol });
  return toCamelCase(row);
}

export async function updateUsuario(email, data) {
  const nombre = data.nombre;
  const rol = data.rol;

  const row = await usuarioModel.update(email, { nombre, rol });
  return row ? toCamelCase(row) : null;
}

export async function deleteUsuario(email) {
  const row = await usuarioModel.deleteByEmail(email);
  return row !== null;
}

import * as clienteModel from '../models/cliente.model.js';
import { toCamelCase } from '../utils/caseConverter.js';

export async function getClientesList() {
  const rows = await clienteModel.findAll();
  return rows.map(row => toCamelCase(row));
}

export async function getClienteById(clienteId) {
  const row = await clienteModel.findById(clienteId);
  return row ? toCamelCase(row) : null;
}

export async function createCliente(data) {
  const clienteId = data.clienteId || data.cliente_id;
  const nombre = data.nombre;
  const telefono = data.telefono || null;
  const email = data.email || null;

  const row = await clienteModel.insert({ clienteId, nombre, telefono, email });
  return toCamelCase(row);
}

export async function updateCliente(clienteId, data) {
  const nombre = data.nombre;
  const telefono = data.telefono || null;
  const email = data.email || null;

  const row = await clienteModel.update(clienteId, { nombre, telefono, email });
  return row ? toCamelCase(row) : null;
}

export async function deleteCliente(clienteId) {
  const row = await clienteModel.deleteById(clienteId);
  return row !== null;
}

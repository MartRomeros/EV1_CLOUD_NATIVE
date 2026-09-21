import pool from '../config/db.js';
import * as otModel from '../models/ot.model.js';
import { toCamelCase } from '../utils/caseConverter.js';

/**
 * Servicio de lógica de negocio para Órdenes de Trabajo (OT).
 */

// Obtiene todas las órdenes formateadas con sus totales agregados (OrdenResumen)
export async function getOrdenesList() {
  const rows = await otModel.findAllWithSummary();
  return rows.map(row => {
    const item = toCamelCase(row);
    return {
      ...item,
      total: Number(item.total) || 0,
      nItems: Number(item.nItems) || 0,
      subtotalCalc: Number(item.subtotalCalc) || 0,
    };
  });
}

// Obtiene el detalle completo de una OT incluyendo sus ítems asociados (OrdenDetalle)
export async function getOrdenById(otId) {
  const otRow = await otModel.findById(otId);
  if (!otRow) {
    return null;
  }

  const itemsRows = await otModel.findItemsByOtId(otId);

  const formattedOt = toCamelCase(otRow);
  formattedOt.total = Number(formattedOt.total) || 0;
  formattedOt.items = itemsRows.map(row => {
    const item = toCamelCase(row);
    return {
      ...item,
      itemId: Number(item.itemId),
      cantidad: Number(item.cantidad),
      precioUnit: Number(item.precioUnit),
      subtotal: Number(item.subtotal),
    };
  });

  return formattedOt;
}

// Crea una OT y sus ítems de forma atómica dentro de una transacción SQL
export async function createOrden(data) {
  const clienteId = data.clienteId || data.cliente_id;
  const patente = data.patente;
  const descripcion = data.descripcion || null;
  const items = Array.isArray(data.items) ? data.items : [];

  // Calcular total automáticamente si hay ítems y no se proveyó total explícito
  let calculatedTotal = 0;
  for (const it of items) {
    const qty = Number(it.cantidad || 0);
    const unitPrice = Number(it.precioUnit ?? it.precio_unit ?? 0);
    calculatedTotal += Math.round(qty * unitPrice);
  }
  const total = data.total !== undefined && data.total !== null ? Number(data.total) : calculatedTotal;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar la orden principal
    const otRow = await otModel.insertOt(client, {
      clienteId,
      patente,
      descripcion,
      total,
    });
    const otId = otRow.ot_id;

    // 2. Insertar cada uno de los ítems provistos
    const createdItems = [];
    for (const it of items) {
      const concepto = it.concepto;
      const cantidad = Number(it.cantidad);
      const precioUnit = Number(it.precioUnit ?? it.precio_unit ?? 0);

      const itemRow = await otModel.insertOtItem(client, {
        otId,
        concepto,
        cantidad,
        precioUnit,
      });
      createdItems.push(itemRow);
    }

    // 3. Registrar evento de auditoría OtCreada
    await otModel.insertOtEvent(client, {
      otId,
      eventType: 'OtCreada',
      payloadJson: JSON.stringify({
        eventType: 'OtCreada',
        otId,
        total: otRow.total,
        itemCount: createdItems.length,
      }),
    });

    await client.query('COMMIT');

    // Retornar detalle completo formateado
    const formattedOt = toCamelCase(otRow);
    formattedOt.total = Number(formattedOt.total) || 0;
    formattedOt.items = createdItems.map(row => {
      const item = toCamelCase(row);
      return {
        ...item,
        itemId: Number(item.itemId),
        cantidad: Number(item.cantidad),
        precioUnit: Number(item.precioUnit),
        subtotal: Number(item.subtotal),
      };
    });

    return formattedOt;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Actualiza los campos principales de una OT
export async function updateOrden(otId, data) {
  const clienteId = data.clienteId || data.cliente_id;
  const patente = data.patente;
  const descripcion = data.descripcion || null;
  const total = data.total !== undefined ? Number(data.total) : undefined;

  const updatedRow = await otModel.updateOt(otId, {
    clienteId,
    patente,
    descripcion,
    total,
  });

  if (!updatedRow) {
    return null;
  }

  const formattedOt = toCamelCase(updatedRow);
  formattedOt.total = Number(formattedOt.total) || 0;
  return formattedOt;
}

// Elimina una OT y sus ítems asociados (en cascada por FK)
export async function deleteOrden(otId) {
  const deletedRow = await otModel.deleteOt(otId);
  return deletedRow !== null;
}

// Agrega un ítem individual a una OT existente
export async function addOtItem(otId, itemData) {
  const otExists = await otModel.findById(otId);
  if (!otExists) {
    return null;
  }

  const concepto = itemData.concepto;
  const cantidad = Number(itemData.cantidad);
  const precioUnit = Number(itemData.precioUnit ?? itemData.precio_unit ?? 0);

  const itemRow = await otModel.insertOtItem(pool, {
    otId,
    concepto,
    cantidad,
    precioUnit,
  });

  const formattedItem = toCamelCase(itemRow);
  return {
    ...formattedItem,
    itemId: Number(formattedItem.itemId),
    cantidad: Number(formattedItem.cantidad),
    precioUnit: Number(formattedItem.precioUnit),
    subtotal: Number(formattedItem.subtotal),
  };
}

// Obtiene los ítems individuales de una OT
export async function getOtItems(otId) {
  const otExists = await otModel.findById(otId);
  if (!otExists) {
    return null;
  }

  const items = await otModel.findItemsByOtId(otId);
  return items.map(row => {
    const item = toCamelCase(row);
    return {
      ...item,
      itemId: Number(item.itemId),
      cantidad: Number(item.cantidad),
      precioUnit: Number(item.precioUnit),
      subtotal: Number(item.subtotal),
    };
  });
}

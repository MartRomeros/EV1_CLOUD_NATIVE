import { useEffect, useState } from "react";
import { itemsApi } from "../api/items";
import type { Item, ItemInput } from "../types/item";
import "./Items.css";

const emptyForm: ItemInput = { nombre: "", descripcion: "" };

export default function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<ItemInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await itemsApi.list();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await itemsApi.update(editingId, form);
      } else {
        await itemsApi.create(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el item.");
    }
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({ nombre: item.nombre, descripcion: item.descripcion });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await itemsApi.remove(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el item.");
    }
  };

  return (
    <div className="items-page">
      <h1>Items</h1>

      <form className="items-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Descripcion"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          required
        />
        <button type="submit">{editingId ? "Actualizar" : "Crear"}</button>
        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="items-error">{error}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="items-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripcion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>{item.descripcion}</td>
                <td className="items-actions">
                  <button onClick={() => handleEdit(item)}>Editar</button>
                  <button onClick={() => handleDelete(item.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3}>No hay items todavia.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

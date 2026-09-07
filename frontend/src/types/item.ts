export interface Item {
  id: string;
  nombre: string;
  descripcion: string;
}

export type ItemInput = Omit<Item, "id">;

import { apiClient } from "./client";
import type { Item, ItemInput } from "../types/item";

// El backend expone estos endpoints via API Gateway HTTP -> NLB -> Backend (ver diagrama de arquitectura).
export const itemsApi = {
  list: () => apiClient.get<Item[]>("/items").then((res) => res.data),
  create: (data: ItemInput) => apiClient.post<Item>("/items", data).then((res) => res.data),
  update: (id: string, data: ItemInput) =>
    apiClient.put<Item>(`/items/${id}`, data).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/items/${id}`),
};

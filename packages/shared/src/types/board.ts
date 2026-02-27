import type { List } from './list.js';

export interface Board {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardWithLists extends Board {
  lists: List[];
}

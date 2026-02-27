import type { Card } from './card.js';

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListWithCards extends List {
  cards: Card[];
}

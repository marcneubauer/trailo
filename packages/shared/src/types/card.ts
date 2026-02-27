export interface Card {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

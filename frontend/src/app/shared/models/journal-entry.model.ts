export type JournalMood = 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'AWFUL';

export interface JournalEntryRequest {
  title: string;
  body: string;
  mood: JournalMood;
  entryDate: string;
}

export interface JournalEntryResponse {
  id: number;
  title: string;
  body: string;
  mood: JournalMood;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

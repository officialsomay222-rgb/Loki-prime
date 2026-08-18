import Dexie, { type EntityTable } from 'dexie';
import { type Task } from '@/src/features/tasks/schemas/taskSchema';

// Define the database with strict typing
const db = new Dexie('GodLevelDatabase') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
};

// Schema declaration (only indexed fields need to be specified here)
db.version(1).stores({
  tasks: 'id, completed, createdAt' 
});

export { db };

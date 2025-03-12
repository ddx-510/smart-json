import { SavedSnippet } from '@/components/json-formatter/SnippetsSidebar';
import { ChatMessage } from '@/components/json-formatter/types';


// IndexedDB helper functions
const dbPromise = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    // Increment the version number to trigger an upgrade
    const request = indexedDB.open('JsonFormatterDB', 2);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening database');
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      // Create snippets store if upgrading from no database (version 0)
      if (oldVersion < 1) {
        console.log('Creating snippets store');
        if (!db.objectStoreNames.contains('snippets')) {
          const snippetStore = db.createObjectStore('snippets', { keyPath: 'id' });
          snippetStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      }
      
      // Create chat stores if upgrading from version 1
      if (oldVersion < 2) {
        console.log('Creating chat stores');
        // Create chatHistory store
        if (!db.objectStoreNames.contains('chatHistory')) {
          const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id' });
          chatStore.createIndex('snippetId', 'snippetId', { unique: false });
        }
        
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'snippetId' });
        }
      }
    };
  });
};

export const createSnippet = async (snippet: Partial<SavedSnippet> & { id: string }): Promise<void> => {
  try {
    const db = await dbPromise();
    const tx = db.transaction('snippets', 'readwrite');
    const store = tx.objectStore('snippets');
    
    // Create new snippet
    const snippetToSave: SavedSnippet = {
      id: snippet.id,
      name: snippet.name || 'Untitled',
      content: snippet.content || '',
      createdAt: snippet.createdAt || Date.now(),
      updatedAt: snippet.updatedAt || Date.now()
    };
    
    return new Promise<void>((resolve, reject) => {
      const putRequest = store.put(snippetToSave);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = (event) => {
        console.error('Error creating snippet:', event);
        reject('Failed to create snippet');
      };
      
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error in createSnippet:', error);
    throw error;
  }
};

export const updateSnippet = async (snippet: Partial<SavedSnippet> & { id: string }): Promise<void> => {
  try {
    const db = await dbPromise();
    const tx = db.transaction('snippets', 'readwrite');
    const store = tx.objectStore('snippets');
    
    // Get the existing snippet
    const getRequest = store.get(snippet.id);
    
    return new Promise<void>((resolve, reject) => {
      getRequest.onsuccess = () => {
        const existingSnippet = getRequest.result;
        
        if (!existingSnippet) {
          reject(`Snippet with id ${snippet.id} not found`);
          return;
        }
        
        // Update existing snippet
        const snippetToSave: SavedSnippet = {
          ...existingSnippet,
          ...snippet,
          updatedAt: snippet.updatedAt || Date.now()
        };
        
        const putRequest = store.put(snippetToSave);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = (event) => {
          console.error('Error updating snippet:', event);
          reject('Failed to update snippet');
        };
      };
      
      getRequest.onerror = (event) => {
        console.error('Error getting existing snippet:', event);
        reject('Failed to get existing snippet');
      };
      
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error in updateSnippet:', error);
    throw error;
  }
};

export const loadSnippets = async (): Promise<SavedSnippet[]> => {
  try {
    const db = await dbPromise();
    const tx = db.transaction('snippets', 'readonly');
    const store = tx.objectStore('snippets');
    
    return new Promise<SavedSnippet[]>((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (event) => {
        console.error('Error loading snippets:', event);
        reject('Failed to load snippets');
      };
      
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error in loadSnippets:', error);
    return [];
  }
};

export const deleteSnippet = async (id: string): Promise<void> => {
  try {
    const db = await dbPromise();
    const tx = db.transaction('snippets', 'readwrite');
    const store = tx.objectStore('snippets');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error deleting snippet:', event);
        reject('Failed to delete snippet');
      };
      
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error in deleteSnippet:', error);
    throw error;
  }
};

// // Migration function to move data from localStorage to IndexedDB (can be called once)
// export const migrateFromLocalStorage = async (): Promise<void> => {
//   const savedSnippets = localStorage.getItem("json-formatter-snippets");
//   if (!savedSnippets) return;
  
//   try {
//     const snippets = JSON.parse(savedSnippets) as SavedSnippet[];
//     for (const snippet of snippets) {
//       await saveSnippet(snippet);
//     }
//     console.log('Successfully migrated snippets from localStorage to IndexedDB');
//     // Optionally clear localStorage after migration
//     // localStorage.removeItem("json-formatter-snippets");
//   } catch (error) {
//     console.error('Error migrating from localStorage:', error);
//   }
// };

export const saveChatHistory = async (snippetId: string, messages: ChatMessage[]) => {
  if (!snippetId) return; // Don't save if no snippet ID
  
  try {
    const db = await dbPromise();
    
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('chatHistory', 'readwrite');
      const store = tx.objectStore('chatHistory');
      
      // First clear existing chat history for this snippet
      const index = store.index('snippetId');
      const clearRequest = index.openKeyCursor(IDBKeyRange.only(snippetId));
      
      const deletePromises: Promise<void>[] = [];
      
      clearRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const deletePromise = new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(cursor.primaryKey);
            deleteRequest.onsuccess = () => resolveDelete();
            deleteRequest.onerror = () => rejectDelete();
          });
          
          deletePromises.push(deletePromise);
          cursor.continue();
        } else {
          // After all deletes are processed, add new messages
          Promise.all(deletePromises)
            .then(() => {
              const addPromises = messages.map((message, idx) => {
                return new Promise<void>((resolveAdd, rejectAdd) => {
                  const addRequest = store.add({
                    id: `${snippetId}_${idx}`,
                    snippetId: snippetId,
                    message: message,
                    timestamp: new Date().toISOString()
                  });
                  
                  addRequest.onsuccess = () => resolveAdd();
                  addRequest.onerror = (e) => {
                    console.error('Error adding message:', e);
                    rejectAdd();
                  };
                });
              });
              
              Promise.all(addPromises)
                .then(() => resolve())
                .catch((err) => {
                  console.error('Error adding messages:', err);
                  reject(err);
                });
            })
            .catch((err) => {
              console.error('Error deleting old messages:', err);
              reject(err);
            });
        }
      };
      
      clearRequest.onerror = (event) => {
        console.error('Clear request error:', event);
        reject('Error clearing old chat history');
      };
      
      tx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error in transaction while saving chat history');
      };
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

export const loadChatHistory = async (snippetId: string): Promise<ChatMessage[]> => {
  console.log("Loading chat history for snippet:", snippetId);
  if (!snippetId) return []; // Return empty array if no snippet ID
  
  try {
    const db = await dbPromise();
    return new Promise<ChatMessage[]>((resolve, reject) => {
      const tx = db.transaction('chatHistory', 'readonly');
      const store = tx.objectStore('chatHistory');
      const index = store.index('snippetId');
      const request = index.getAll(IDBKeyRange.only(snippetId));
      
      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by the numeric part of the ID to maintain order
        results.sort((a, b) => {
          const aIdx = parseInt(a.id.split('_')[1]);
          const bIdx = parseInt(b.id.split('_')[1]);
          return aIdx - bIdx;
        });
        resolve(results.map(item => item.message));
      };
      
      request.onerror = (event) => {
        console.error('Request error:', event);
        reject('Error loading chat history');
      };
      
      tx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error in transaction while loading chat history');
      };
    });
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

export const saveConversationId = async (snippetId: string, conversationId: string) => {
  if (!snippetId) return; // Don't save if no snippet ID
  
  try {
    const db = await dbPromise();
    const tx = db.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');
    
    store.put({ snippetId, conversationId });
    
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error saving conversation ID');
      };
    });
  } catch (error) {
    console.error('Error saving conversation ID:', error);
  }
};

export const loadConversationId = async (snippetId: string): Promise<string> => {
  if (!snippetId) return ''; // Return empty string if no snippet ID
  
  try {
    const db = await dbPromise();
    const tx = db.transaction('conversations', 'readonly');
    const store = tx.objectStore('conversations');
    const request = store.get(snippetId);
    
    return new Promise<string>((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result?.conversationId || '');
      };
      
      request.onerror = (event) => {
        console.error('Request error:', event);
        reject('Error loading conversation ID');
      };
    });
  } catch (error) {
    console.error('Error loading conversation ID:', error);
    return '';
  }
};

export const clearChatData = async (snippetId: string) => {
  if (!snippetId) return; // Don't clear if no snippet ID
  
  try {
    const db = await dbPromise();
    
    // Clear chat history
    const chatTx = db.transaction('chatHistory', 'readwrite');
    const chatStore = chatTx.objectStore('chatHistory');
    const index = chatStore.index('snippetId');
    const request = index.openKeyCursor(IDBKeyRange.only(snippetId));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        chatStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    
    await new Promise<void>((resolve, reject) => {
      chatTx.oncomplete = () => resolve();
      chatTx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error clearing chat history');
      };
    });
    
    // Clear conversation ID
    const convTx = db.transaction('conversations', 'readwrite');
    const convStore = convTx.objectStore('conversations');
    convStore.delete(snippetId);
    
    return new Promise<void>((resolve, reject) => {
      convTx.oncomplete = () => resolve();
      convTx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error clearing conversation ID');
      };
    });
  } catch (error) {
    console.error('Error clearing chat data:', error);
  }
};
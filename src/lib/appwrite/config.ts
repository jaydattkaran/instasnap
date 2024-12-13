import { Client, Account, Databases, Storage, Avatars } from "appwrite";
// import { replace } from "react-router-dom";

// VITE_APPWRITE_PROJECT_ID = '66bf92ef003d72de690a'
// VITE_APPWRITE_URL = 'https://cloud.appwrite.io/v1'
// VITE_APPWRITE_STORAGE_ID = '66c06a46001a48839abc'
// VITE_APPWRITE_DATABASE_ID = '66c0696a000a715fdde3'
// VITE_APPWRITE_SAVES_COLLECTION_ID = '66c06a46001a48839abc'
// VITE_APPWRITE_POST_COLLECTION_ID = '66c069ba003243f5285b'
// VITE_APPWRITE_USER_COLLECTION_ID = '66c06a130026c4f69649'

export const appwriteConfig = {
    url: 'https://cloud.appwrite.io/v1',
    projectId: '66bf92ef003d72de690a',
    databaseId: '66c0696a000a715fdde3',
    storageId: '66c068c60034fb8ff6cb',
    userCollectionId: '66c06a130026c4f69649',
    postCollectionId: '66c069ba003243f5285b',
    savesCollectionId: '66c06a46001a48839abc',
  };
  

export const client = new Client();

client.setProject(appwriteConfig.projectId);
client.setEndpoint(appwriteConfig.url)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
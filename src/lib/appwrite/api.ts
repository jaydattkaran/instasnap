import { ID, Query } from "appwrite";
import { INewUser, INewPost, IUpdatePost } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
// import exp from "constants";

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error("Account creation failed.");

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl,
    });

    return newUser;
  } catch (error) {
    console.error("Error in createUserAccount:", error);
    return null;
  }
}

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );

    console.log("New user saved:", newUser);
    return newUser;
  } catch (error) {
    console.error("Error in saveUserToDB:", error);
    return null;
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(user.email, user.password);
    // console.log("Session created:", session);

    return session;
  } catch (error) {
    console.log("Login error:",error);
    throw error;
  }
}


export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    console.log("No active session:",error);
    return null;
  }
}
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      console.error("No current account found");
      return null;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser.documents.length){
      console.error("No user found for this account");
      return null;
    }

    return currentUser.documents[0];
  } catch (error) {
    console.log("Error getting current user:",error);
    return null;
  }
}

export async function createPost(post: INewPost) {
  try {
    //upload image to storage
    const uploadedFile = await uploadFile(post.file[0]);

    if(!uploadedFile) throw Error;

    // Get the url
    const fileUrl = getFilePreview(uploadedFile.$id);

    // console.log(fileUrl);

    if(!fileUrl) {
      deleteFile(uploadedFile.$id)  
      throw Error;
    }

    // convert tags in an array
    const tags = post.tags?.replace(/ /g,'').split(',') || [];


    
    // save post to databases
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags
      }
    )

    if(!newPost) {
      await deleteFile(uploadedFile.$id)  
      throw Error;
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log(error)
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      undefined,
      100,
    )

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: 'ok'}
  } catch (error) {
    console.log(error);
  }
}

export async function getRecentPosts() {
  const posts = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.postCollectionId,
    [Query.orderDesc('$createdAt'), Query.limit(20)]
  )

  if(!posts) throw Error;

  return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray
      }
    )

    if(!updatedPost) throw Error;

    return updatedPost
  } catch (error) {
    console.log(error);
  }  
}

export async function savePost(postId: string, userId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
      }
    )

    if(!updatedPost) throw Error;

    return updatedPost
  } catch (error) {
    console.log(error);
  }  
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId,
    )

    if(!statusCode) throw Error;

    return { status: 'ok'}
  } catch (error) {
    console.log(error);
  }  
}

export async function getPostById(postId: string) {
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )

    return post
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    }

    if(hasFileToUpdate) {
      //upload image to storage
      const uploadedFile = await uploadFile(post.file[0]);

      if(!uploadedFile) throw Error;

      // Get the url
      const fileUrl = getFilePreview(uploadedFile.$id);
  
      // console.log(fileUrl);
  
      if(!fileUrl) {
        deleteFile(uploadedFile.$id)  
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id}
    }

    // convert tags in an array
    const tags = post.tags?.replace(/ /g,'').split(',') || [];


    
    // save post to databases
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags
      }
    )

    if(!updatedPost) {
      await deleteFile(post.imageId)  
      throw Error;
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

export async function deletePost(postId: string, imageId: string) {
  if(!postId || !imageId) throw Error;

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId
    )

    return { status: 'ok'}
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam:
number}) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(10)]

  if(pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries
    )

    if(!posts) throw Error;

    return posts;
  } catch (error) {
   console.log(error);
  }
}

export async function searchPosts(searchTerm: string) {
  
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search('caption', searchTerm)]
    )

    if(!posts) throw Error;

    return posts;
  } catch (error) {
   console.log(error);
  }
}
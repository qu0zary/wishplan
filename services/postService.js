import { supabase } from '../lib/supabase';
import { uploadFile } from './ImageService';

export const createOrUpdatePost = async (post) => {
  try {
    if (post.file && typeof post.file === 'object') {
      const isImage =
        post.file?.type?.includes('image') ||
        post.file?.uri?.endsWith('.jpg') ||
        post.file?.uri?.endsWith('.png');
      const folderName = isImage ? 'postImages' : 'postVideos';

      const fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
      if (fileResult.success) post.file = fileResult.data;
      else return fileResult;
    }

    const { data, error } = await supabase.from('posts').upsert(post).select().single();
    if (error) return { success: false, msg: 'Could not create your post' };
    return { success: true, data };
  } catch (error) {
    console.log('createOrUpdatePost error:', error);
    return { success: false, msg: 'Could not create your post' };
  }
};

export const fetchPosts = async (limit = 10, userId) => {
  try {
    let query = supabase
      .from('posts')
      .select(
        `
        *,
        users: users (id, name, image),
        postLikes (*)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.log('fetchPosts error:', error);
      return { success: false, msg: 'Could not fetch the posts' };
    }

    console.log('fetchPosts data:', data);
    return { success: true, data };
  } catch (error) {
    console.log('fetchPosts error:', error);
    return { success: false, msg: 'Could not fetch the posts' };
  }
};

export const fetchPostDetails = async (postId) => {
  try {
    if (!postId || isNaN(parseInt(postId))) {
      console.error('Invalid postId in fetchPostDetails:', postId);
      return { success: false, msg: 'Invalid post ID' };
    }

    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        users: users (id, name, image),
        postLikes (*),
        comments (*, user: users(id, name, image))
      `,
      )
      .eq('id', parseInt(postId))
      .order('created_at', { ascending: false, foreignTable: 'comments' })
      .single();

    if (error) return { success: false, msg: 'Could not fetch the post' };
    return { success: true, data };
  } catch (error) {
    console.log('fetchPostDetails error:', error);
    return { success: false, msg: 'Could not fetch the post' };
  }
};

export const createComment = async (comment) => {
  try {
    const { data, error } = await supabase.from('comments').insert(comment).select().single();
    if (error) return { success: false, msg: 'Could not create your comment' };
    return { success: true, data };
  } catch (error) {
    console.log('createComment error:', error);
    return { success: false, msg: 'Could not create your comment' };
  }
};

export const removeComment = async (commentId) => {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) return { success: false, msg: 'Could not remove the comment' };
    return { success: true, data: { commentId } };
  } catch (error) {
    console.log('removeComment error:', error);
    return { success: false, msg: 'Could not remove the comment' };
  }
};

export const createPostLike = async (postLike) => {
  try {
    const { data, error } = await supabase
      .from('postLikes')
      .insert({ ...postLike, postId: postLike.postId })
      .select()
      .single();

    if (error) return { success: false, msg: 'Could not like the post' };
    return { success: true, data };
  } catch (error) {
    console.log('createPostLike error:', error);
    return { success: false, msg: 'Could not like the post' };
  }
};

export const removePostLike = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('postLikes')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId);

    if (error) return { success: false, msg: 'Could not remove the post like' };
    return { success: true };
  } catch (error) {
    console.log('removePostLike error:', error);
    return { success: false, msg: 'Could not remove the post like' };
  }
};

export const removePost = async (postId) => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) return { success: false, msg: 'Could not remove the post' };
    return { success: true, data: { postId } };
  } catch (error) {
    console.log('removePost error:', error);
    return { success: false, msg: 'Could not remove the post' };
  }
};

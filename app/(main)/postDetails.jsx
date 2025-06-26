import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../../assets/icons';
import CommentItem from '../../components/CommentItem';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import PostCard from '../../components/PostCard';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { createNotification } from '../../services/notificationService';
import {
  createComment,
  fetchPostDetails,
  removeComment,
  removePost,
} from '../../services/postService';

const PostDetails = () => {
  const { postId, commentId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const inputRef = useRef(null);
  const commentRef = useRef('');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    const validId = parseInt(postId);
    if (!postId || isNaN(validId)) {
      //console.error('Invalid postId:', postId);
      // Alert.alert('Error', 'Invalid ID wish');
      setInitialLoading(false);
      return;
    }

    try {
      const res = await fetchPostDetails(validId);
      if (res.success) {
        setPost(res.data);
      } else {
        Alert.alert('Error', res.msg || 'Failed to load wish');
      }
    } catch (err) {
      console.error('Error loading wish:', err);
      Alert.alert('Error', 'There was an error loading the wish');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddComment = async () => {
    const commentText = commentRef.current.trim();
    if (!commentText) return;

    if (!user?.id || !post?.id) {
      Alert.alert('Error', 'User or desire not defined');
      return;
    }

    const data = {
      userId: user.id,
      postId: post.id,
      text: commentText,
    };

    setLoading(true);
    const res = await createComment(data);
    setLoading(false);
    if (res.success) {
      if (user.id !== post.userId) {
        // send notification
        let notify = {
          sendereID: user.id,
          receiverId: post.userId,
          title: 'commented on your wish',
          data: JSON.stringify({ postId: post.id, commentId: res?.data?.id }),
        };
        createNotification(notify);
      }
    }
    if (res.success) {
      inputRef?.current?.clear();
      commentRef.current = '';
      setPost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data],
      }));
    } else {
      Alert.alert('Comment', res.msg || 'Failed to delete comment');
    }
  };

  const handleDeleteComment = async (comment) => {
    const res = await removeComment(comment?.id);
    if (res.success) {
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== comment.id),
      }));
    } else {
      Alert.alert('Comment', res.msg || 'Failed to delete comment');
    }
  };

  const onDeletePost = async () => {
    const res = await removePost(post.id);
    if (res.success) {
      router.back();
    } else {
      Alert.alert('Wish', res.msg || 'Failed to delete wish');
    }
  };

  const onEditPost = async () => {
    router.back();
    router.push({ pathname: 'newPost', params: { ...post } });
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <Loading />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
        <Text style={styles.notFound}>Wish not found!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <PostCard
          item={post}
          currentUser={user}
          router={router}
          hasShadow={false}
          showMoreIcon={false}
          onDelete={onDeletePost}
          onEdit={onEditPost}
        />

        {/* Input for new comment */}
        <View style={styles.inputContainer}>
          <Input
            inputRef={inputRef}
            placeholder="Write a comment..."
            onChangeText={(value) => (commentRef.current = value)}
            placeholderTextColor={theme.colors.textLight}
            containerStyle={{ flex: 1, height: hp(6.2), borderRadius: theme.radius.xl }}
          />

          {loading ? (
            <View style={styles.loading}>
              <Loading size="small" />
            </View>
          ) : (
            <TouchableOpacity style={styles.sendIcon} onPress={handleAddComment}>
              <Icon name="send" color={theme.colors.primaryDark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Comments list */}
        <View style={{ marginVertical: 15, gap: 17 }}>
          {post?.comments?.length > 0 ? (
            post.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                item={comment}
                onDelete={handleDeleteComment}
                highlight={comment.id === commentId}
                canDelete={user.id === comment.userId || user.id === post.userId}
              />
            ))
          ) : (
            <Text style={{ color: theme.colors.text, marginLeft: 5 }}>
              Be the first to comment!
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: wp(7),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  list: {
    paddingHorizontal: wp(4),
  },
  sendIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    height: hp(5.8),
    width: hp(5.8),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: hp(2.5),
    color: theme.colors.text,
    fontWeight: theme.fonts.medium,
  },
  loading: {
    height: hp(5.8),
    width: hp(5.8),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.3 }],
  },
});

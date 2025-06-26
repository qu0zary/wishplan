import { Image } from 'expo-image';
import { VideoView } from 'expo-video';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import Icon from '../assets/icons';
import Loading from '../components/Loading';
import { theme } from '../constants/theme';
import { hp, stripHtmlTags, wp } from '../helpers/common';
import { downloadFile, getSupabaseFileUrl } from '../services/ImageService';
import { createPostLike, removePostLike } from '../services/postService';
import Avatar from './Avatar';

const htmlTextStyles = {
  color: theme.colors.dark,
  fontSize: hp(1.75),
};

const tagsStyles = {
  div: htmlTextStyles,
  p: htmlTextStyles,
  ol: htmlTextStyles,
  h1: { color: theme.colors.dark },
  h4: { color: theme.colors.dark },
};

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = true, // false
  onDelete = () => {},
  onEdit = () => {},
}) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);

  const shadowStyles = hasShadow
    ? {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
      }
    : {};

  useEffect(() => {
    if (item?.postLikes) {
      setLikes(item.postLikes);
    }
  }, [item?.postLikes]);

  const liked = useMemo(() => {
    return likes.some((like) => like?.userId === currentUser?.id);
  }, [likes, currentUser?.id]);

  const openPostDetails = useCallback(() => {
    if (!showMoreIcon && !item?.comments) return;

    if (!item?.id) {
      console.error('Navigation error: item.id missing', item);
      Alert.alert('Error', 'Failed to open post. Post ID is missing.');
      return;
    }

    router.push({ pathname: '/postDetails', params: { postId: item.id.toString() } });
  }, [item?.id, showMoreIcon, item?.comments]);

  const onLike = useCallback(async () => {
    if (!currentUser?.id || !item?.id) {
      console.error('Like error: missing userId or postId', {
        userId: currentUser?.id,
        postId: item?.id,
      });
      Alert.alert('Error', 'No user data or wishes found.');
      return;
    }

    setLoading(true);
    try {
      if (liked) {
        const updatedLikes = likes.filter((like) => like?.userId !== currentUser.id);
        setLikes(updatedLikes);
        const res = await removePostLike(item.id, currentUser.id);
        if (!res.success) {
          console.error('Error deleting like:', res.msg, res.error);
          Alert.alert('Error', `Failed to delete like: ${res.msg || 'Unknown error'}`);
          setLikes(likes);
        }
      } else {
        const newLike = { userId: currentUser.id, postId: item.id };
        setLikes([...likes, newLike]);
        const res = await createPostLike(newLike);
        if (!res.success) {
          console.error('Error add like:', res.msg, res.error);
          Alert.alert('Error', `Failed to add like: ${res.msg || 'Unknown error'}`);
          setLikes(likes);
        }
      }
    } catch (error) {
      console.error('Critical Like Error:', error.message, error.stack);
      Alert.alert('Error', 'There was an error processing the like.');
      setLikes(likes);
    } finally {
      setLoading(false);
    }
  }, [liked, likes, currentUser?.id, item?.id]);

  const onShare = useCallback(async () => {
    setLoading(true);
    try {
      let message = stripHtmlTags(item?.body || '');
      if (item?.title) {
        message = `${item.title}\n\n${message}`;
      }
      if (item?.file) {
        const url = await downloadFile(getSupabaseFileUrl(item.file).uri);
        if (url) message += `\n\n${url}`;
      }
      await Share.share({ message });
    } catch (error) {
      console.error('Error while sharing:', error);
      Alert.alert('Error', 'Failed to share wish.');
    } finally {
      setLoading(false);
    }
  }, [item?.body, item?.file, item?.title]);

  const handlePostDelete = () => {
    Alert.alert('Delete wish?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => onDelete(item), style: 'destructive' },
    ]);
  };

  const createdAt = moment(item?.created_at).format('MMM D');
  const commentCount = Array.isArray(item?.comments) ? item.comments.length : 0;

  return (
    <View style={[styles.container, shadowStyles]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar size={hp(4.5)} uri={item?.user?.image} rounded={theme.radius.md} />
          <View style={{ gap: 2 }}>
            <Text style={styles.username}>{item?.user?.name || 'Unknown'}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        {showDelete && currentUser?.id === item?.userId && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(item)}>
              <Icon name="edit" size={hp(2.5)} strokeWidth={3} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePostDelete}>
              <Icon name="delete" size={hp(2.5)} strokeWidth={3} color={theme.colors.rose} />
            </TouchableOpacity>
            {showMoreIcon && (
              <TouchableOpacity onPress={openPostDetails}>
                <Icon
                  name="threeDotsHorizontal"
                  size={hp(3.4)}
                  strokeWidth={3}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {item?.title && <Text style={styles.postTitle}>{item.title}</Text>}
        <View style={styles.postBody}>
          {item?.body ? (
            <RenderHTML
              contentWidth={wp(100)}
              source={{ html: item.body }}
              tagsStyles={tagsStyles}
              defaultTextProps={{ selectable: true }}
            />
          ) : (
            <Text style={htmlTextStyles}>No content</Text>
          )}
        </View>

        {item?.file?.includes('postImage') && (
          <Image
            source={getSupabaseFileUrl(item.file)}
            transition={100}
            style={styles.postMedia}
            contentFit="cover"
          />
        )}

        {item?.file?.includes('postVideos') && (
          <VideoView
            style={[styles.postMedia, { height: hp(30) }]}
            source={getSupabaseFileUrl(item.file)}
            useNativeControls
            contentFit="cover"
            isLooping
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike} disabled={loading}>
            <Icon
              name="heart"
              size={24}
              fill={liked ? theme.colors.rose : 'transparent'}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likes?.length || 0}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          {/* <Text style={styles.count}>{commentCount}</Text> */}
        </View>

        <View style={styles.footerButton}>
          {loading ? (
            <Loading size="small" />
          ) : (
            <TouchableOpacity onPress={onShare} disabled={loading}>
              <Icon name="share" size={24} color={theme.colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    borderRadius: theme.radius.xxl * 1.1,
    borderCurve: 'continuous',
    padding: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  postTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textDark,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  content: {
    gap: 10,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
  },
  postBody: {
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerButton: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  count: {
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
});

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import PostCard from '../../components/PostCard';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { fetchPosts } from '../../services/postService';
import { getUserData } from '../../services/UserService';

const PAGE_SIZE = 10;

const Home = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const handlePostEvent = async (payload) => {
    console.log('Post event received:', payload);

    if (payload.eventType === 'INSERT' && payload?.new?.id) {
      const newPost = { ...payload.new };
      const res = await getUserData(newPost.userId);

      newPost.postLikes = [];
      newPost.comments = [{ count: 0 }];
      newPost.user = res.success ? res.data : {};

      setPosts((prev) => [newPost, ...prev]);
    }

    if (payload.eventType === 'DELETE' && payload?.old?.id) {
      setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
    }

    if (payload.eventType === 'UPDATE' && payload?.new?.id) {
      setPosts((prev) => prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)));
    }
  };

  const handleNewNotifications = async (payload) => {
    console.log('got new notification: ', payload);
    if (payload.eventType === 'INSERT' && payload.new.id) {
      setNotificationCount((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const postChannelName = `posts-${user.id}`;
    const notifChannelName = `notifications-${user.id}`;

    // Проверим, есть ли уже каналы
    let postChannel = supabase.getChannels().find((c) => c.topic === `realtime:${postChannelName}`);

    if (!postChannel) {
      postChannel = supabase
        .channel(postChannelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
        .subscribe((status) => {
          console.log('Subscribed to posts:', status);
        });
    }

    let notificationChannel = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${notifChannelName}`);

    if (!notificationChannel) {
      notificationChannel = supabase
        .channel(notifChannelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `receiverId=eq.${user.id}`,
          },
          handleNewNotifications,
        )
        .subscribe((status) => {
          console.log('Subscribed to notifications:', status);
        });
    }

    return () => {
      console.log('Removing channels...');
      supabase.removeChannel(postChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refetchPosts = async () => {
        setLoading(true);
        try {
          const res = await fetchPosts(PAGE_SIZE);
          if (res.success && Array.isArray(res.data) && isActive) {
            setPosts(res.data);
            setPage(1);
            setHasMore(res.data.length === PAGE_SIZE);
          } else {
            console.warn('Ошибка загрузки постов при возврате на Home');
          }
        } catch (err) {
          console.error('Ошибка при refetch:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      refetchPosts();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const loadPosts = async (pageToLoad) => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const limit = PAGE_SIZE * pageToLoad;
      const res = await fetchPosts(limit);

      if (res.success && Array.isArray(res.data)) {
        setPosts(res.data);

        if (res.data.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        setPage(pageToLoad);
      } else {
        console.warn('fetchPosts returned incorrect data:', res);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const renderItem = ({ item }) => {
    if (!item?.id) {
      console.warn('Wish without id:', item);
      return null;
    }

    return <PostCard item={item} currentUser={user} router={router} />;
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wishplan</Text>
          <View style={styles.icons}>
            <Pressable
              onPress={() => {
                setNotificationCount(0);
                router.push('/notifications');
              }}
            >
              <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
              {notificationCount > 0 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{notificationCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push('/newPost')}>
              <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar
                uri={user?.image}
                size={hp(4.3)}
                rounded={theme.radius.sm}
                style={{ borderWidth: 2 }}
              />
            </Pressable>
          </View>
        </View>

        {/* Posts */}
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => item?.id?.toString() ?? `fallback-${index}`}
          renderItem={renderItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loading ? (
              <View style={{ marginVertical: posts.length === 0 ? 200 : 30 }}>
                <Loading />
              </View>
            ) : !hasMore ? (
              <View style={{ marginVertical: 30 }}>
                <Text style={styles.noPosts}>No more wish</Text>
              </View>
            ) : null
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4),
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  listStyle: {
    paddingTop: 20,
    paddingHorizontal: wp(4),
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
});

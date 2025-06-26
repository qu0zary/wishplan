import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import PostCard from '../../components/PostCard';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';
import { fetchPosts } from '../../services/postService';

const Profile = () => {
  const { user, setAuth } = useAuth();
  const router = useRouter();

  const [hasMore, setHasMore] = useState(true);
  const [posts, setPosts] = useState([]);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    getPosts();
  }, []);

  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Exit', 'Error exiting!');
    } else {
      setAuth(null);
      router.replace('/welcome');
    }
  };

  const getPosts = async () => {
    if (!hasMore) return;

    console.log('Loading a wish:', limit);
    const res = await fetchPosts(limit, user.id);
    if (res.success) {
      if (posts.length === res.data.length) {
        setHasMore(false);
      } else {
        setPosts(res.data);
        setLimit((prev) => prev + 10);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert('Confirm', 'Are you sure you want to exit?', [
      {
        text: 'Cancel',
        onPress: () => console.log('Modal window cancelled'),
        style: 'cancel',
      },
      {
        text: 'Exit',
        onPress: () => onLogout(),
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScreenWrapper bg="white">
      <FlatList
        data={posts}
        ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout} />}
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostCard item={item} currentUser={user} router={router} />}
        onEndReached={() => {
          getPosts();
          console.log('The end of the list has been reached');
        }}
        onEndReachedThreshold={0}
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginVertical: posts.length === 0 ? 100 : 30 }}>
              <Loading />
            </View>
          ) : (
            <View style={{ marginVertical: 30 }}>
              <Text style={styles.noPosts}>No more wishes</Text>
            </View>
          )
        }
      />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, router, handleLogout }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingHorizontal: wp(4) }}>
      <View>
        <Header title="Профиль" mb={30} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" color={theme.colors.rose} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={{ gap: 15 }}>
          <View style={styles.avatarContainer}>
            <Avatar uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
            <Pressable style={styles.editIcon} onPress={() => router.push('/editProfile')}>
              <Icon name="edit" strokeWidth={2.5} size={20} />
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={styles.userName}>{(user && user.name) || 'Без имени'}</Text>
            <Text style={styles.infoText}>{(user && user.address) || 'Без адреса'}</Text>
          </View>

          <View style={{ gap: 10 }}>
            <View style={styles.info}>
              <Icon name="mail" size={20} color={theme.colors.textLight} />
              <Text style={styles.infoText}>{user && user.email}</Text>
            </View>
            {user && user.phoneNumber && (
              <View style={styles.info}>
                <Icon name="call" size={20} color={theme.colors.textLight} />
                <Text style={styles.infoText}>{user && user.phoneNumber}</Text>
              </View>
            )}
            <View style={styles.info}>
              <Icon name="info" size={20} color={theme.colors.textLight} />
              {user && user.bio && <Text style={styles.infoText}>{user.bio}</Text>}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listStyle: {
    paddingHorizontal: wp(4),
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  headerShape: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight,
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#fee2e2',
  },
  noPosts: {
    fontSize: hp(1.8),
    textAlign: 'center',
    color: theme.colors.textLight,
  },
});

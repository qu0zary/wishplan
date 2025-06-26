import { Video } from 'expo-av';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Header from '../../components/Header';
import RichTextEditor from '../../components/RichTextEditor';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { getSupabaseFileUrl } from '../../services/ImageService';
import { createOrUpdatePost } from '../../services/postService';

const NewPost = () => {
  const post = useLocalSearchParams();
  console.log('post: ', post);
  const { user } = useAuth();
  const bodyRef = useRef('');
  const editorRef = useRef(null);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (post && post.id) {
      bodyRef.current = post.body;
      setFile(post.file || null);
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body);
      }, 300);
    }
  }, []);

  const onPick = async (isImage) => {
    try {
      const mediaConfig = {
        mediaTypes: isImage ? ['images'] : ['videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      };

      const result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Could not pick the media');
    }
  };

  const isLocalFile = (file) => {
    return file && typeof file === 'object';
  };

  const getFileType = (file) => {
    if (!file) return null;

    if (isLocalFile(file)) {
      return file.type;
    }

    if (file.includes('postImages')) {
      return 'image';
    }

    return 'video';
  };

  const getFileUri = (file) => {
    if (!file) return null;

    if (isLocalFile(file)) {
      return file.uri;
    }

    return getSupabaseFileUrl(file)?.uri || null;
  };

  const onSubmit = async () => {
    if ((!bodyRef.current || bodyRef.current.trim() === '') && !file) {
      Alert.alert('Publish', 'Please choose an image/video or add wish body');
      return;
    }

    const data = {
      file,
      body: bodyRef.current,
      userId: user?.id,
    };

    if (post && post.id) data.id = post.id;

    // create post
    setLoading(true);
    let res = await createOrUpdatePost(data);
    setLoading(false);
    if (res.success) {
      setFile(null);
      bodyRef.current = '';
      editorRef.current?.setContentHTML('');
      router.back();
    } else {
      Alert.alert('Post', res.msg);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Create wish" />
        <ScrollView contentContainerStyle={{ gap: 20 }}>
          {/* Header with avatar and name */}
          <View style={styles.header}>
            <Avatar uri={user?.image} size={hp(6.5)} rounded={theme.radius.xl} />
            <View style={{ gap: 2 }}>
              <Text style={styles.username}>{user?.name}</Text>
              <Text style={styles.publicText}>Public</Text>
            </View>
          </View>

          {/* Text editor */}
          <View style={styles.textEditor}>
            <RichTextEditor editorRef={editorRef} onChange={(body) => (bodyRef.current = body)} />
          </View>

          {/* Preview of the selected file */}
          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                <Video
                  key={getFileUri(file)}
                  style={{
                    width: '100%',
                    height: hp(30),
                    borderRadius: theme.radius.xl,
                    backgroundColor: 'black',
                  }}
                  source={{ uri: getFileUri(file) }}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              ) : (
                <Image source={{ uri: getFileUri(file) }} contentFit="cover" style={{ flex: 1 }} />
              )}

              <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                <Icon name="delete" size={20} color="white" />
              </Pressable>
            </View>
          )}

          {/* Кнопки выбора медиа */}
          <View style={styles.media}>
            <Text style={styles.addImageText}>Add to your wish</Text>
            <View style={styles.mediaIcons}>
              <TouchableOpacity onPress={() => onPick(true)} style={styles.mediaIconButton}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)} style={styles.mediaIconButton}>
                <Icon name="video" size={33} color={theme.colors.dark} />
              </TouchableOpacity>
            </View>
          </View>
          <Button
            buttonStyle={{ height: hp(6.2) }}
            title={post && post.id ? 'Update' : 'Post'}
            loading={loading}
            hasShadow={false}
            onPress={onSubmit}
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default NewPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  textEditor: {
    // можно добавить стили, если нужны
  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderColor: theme.colors.gray,
  },
  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaIconButton: {
    padding: 5,
  },
  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(236, 230, 230, 0.6)',
  },
});

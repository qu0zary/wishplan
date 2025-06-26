import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const Welcome = () => {
  const router = useRouter();
  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* welcome image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/welcome.png')}
        />

        {/* title */}
        <View style={{ gap: 20 }}>
          <Text style={styles.title}>Wishplan</Text>
          <Text style={styles.punchline}>Where every desire finds a response.</Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
            title="Getting Started"
            buttonStyle={{ marginHorizontal: wp(3) }}
            onPress={() => router.push('signUp')}
          />
          <View style={styles.bottomTextContainer}>
            <Text style={styles.loginText}>Already have an account!</Text>
            <Pressable onPress={() => router.push('login')}>
              <Text
                style={[
                  styles.loginText,
                  { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold },
                ]}
              >
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingHorizontal: wp(4),
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100),
    alignSelf: 'center',
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.extraBold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  punchline: {
    fontSize: hp(1.7),
    textAlign: 'center',
    paddingHorizontal: wp(10),
    color: theme.colors.text,
  },
  footer: {
    width: '100%',
    gap: 30,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    marginHorizontal: wp(3),
  },
  buttonText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  loginText: {
    fontSize: hp(1.6),
    color: theme.colors.text,
    textAlign: 'center',
  },
});

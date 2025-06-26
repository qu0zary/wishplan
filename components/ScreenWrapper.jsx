import { View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

const ScreenWrapper = ({ children, bg }) => {
  const { top } = useSafeAreaFrame;
  const paddingTop = top > 0 ? top + 5 : 30;
  return <View style={{ flex: 1, paddingTop, backgroundColor: bg }}>{children}</View>;
};

export default ScreenWrapper;

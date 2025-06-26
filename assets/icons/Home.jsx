import { Home01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const Home = () => (
  <HugeiconsIcon icon={Home01Icon} size={24} color={theme.colors.icon} strokeWidth={1.5} />
);

export default Home;

import { User02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const User = () => (
  <HugeiconsIcon icon={User02Icon} size={24} color={theme.colors.icon} strokeWidth={1.5} />
);

export default User;

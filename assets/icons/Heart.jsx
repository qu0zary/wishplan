import { FavouriteIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const Heart = () => (
  <HugeiconsIcon icon={FavouriteIcon} size={24} color={theme.colors.icon} strokeWidth={1.5} />
);

export default Heart;

import { Image01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const Image = () => (
  <HugeiconsIcon icon={Image01Icon} size={24} color={theme.colors.icon} strokeWidth={1.5} />
);

export default Image;

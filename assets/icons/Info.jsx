import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const Info = () => (
  <HugeiconsIcon
    icon={InformationCircleIcon}
    size={24}
    color={theme.colors.icon}
    strokeWidth={1.5}
  />
);

export default Info;

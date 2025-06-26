import { MoreVerticalCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { theme } from '../../constants/theme';

export const ThreeDotsCircle = () => (
  <HugeiconsIcon
    icon={MoreVerticalCircle01Icon}
    size={24}
    color={theme.colors.icon}
    strokeWidth={1.5}
  />
);

export default ThreeDotsCircle;

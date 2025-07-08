declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    className?: string;
  }
  
  export const ArrowLeft: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Download: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const Play: FC<IconProps>;
  export const Pause: FC<IconProps>;
  export const RefreshCw: FC<IconProps>;
  export const Image: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const AlertCircle: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Eye: FC<IconProps>;
  export const Edit3: FC<IconProps>;
  export const Tag: FC<IconProps>;
  export const FileText: FC<IconProps>;
  export const X: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Search: FC<IconProps>;
  export const Filter: FC<IconProps>;
  export const MoreHorizontal: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const HardDrive: FC<IconProps>;
  export const Cloud: FC<IconProps>;
  // Добавьте другие иконки по мере необходимости
}
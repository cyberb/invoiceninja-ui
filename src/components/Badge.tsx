/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import classNames from 'classnames';
import { useAccentColor } from '$app/common/hooks/useAccentColor';
import CommonProps from '../common/interfaces/common-props.interface';

interface Props extends CommonProps {
  variant?:
    | 'primary'
    | 'white'
    | 'yellow'
    | 'red'
    | 'generic'
    | 'light-blue'
    | 'blue'
    | 'orange'
    | 'dark-blue'
    | 'green'
    | 'black'
    | 'purple'
    | 'transparent';
}

const defaultProps: Props = {
  variant: 'generic',
};

export function Badge(props: Props) {
  props = { ...defaultProps, ...props };

  const accentColor = useAccentColor();

  const styles: React.CSSProperties = { ...props.style };

  if (props.variant === 'primary') {
    styles.backgroundColor = styles.backgroundColor || accentColor;
    styles.color = 'white';
  }

  return (
    <span
      style={styles}
      className={classNames(
        'text-xs px-2 py-1 rounded',
        {
          'bg-transparent': props.variant === 'transparent',
          'bg-gray-500 text-white': props.variant === 'generic',
          'bg-white border text-gray-900 hover:bg-white':
            props.variant === 'white',
          'bg-yellow-600 text-white': props.variant === 'yellow',
          'bg-red-600 text-white': props.variant === 'red',
          'bg-blue-300 text-white': props.variant === 'light-blue',
          'bg-blue-400 text-white': props.variant === 'blue',
          'bg-blue-700 text-white': props.variant === 'dark-blue',
          'bg-orange-500 text-white': props.variant === 'orange',
          'bg-green-500 text-white': props.variant === 'green',
          'bg-black text-white': props.variant === 'black',
          'bg-purple text-white': props.variant === 'purple',
        },
        props.className
      )}
    >
      {props.children}
    </span>
  );
}

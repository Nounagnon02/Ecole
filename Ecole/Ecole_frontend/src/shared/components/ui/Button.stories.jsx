import Button from './Button';

export default {
  title: 'Érudit/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    children: 'Enregistrer',
    variant: 'primary',
    size: 'md',
  },
};

export const Primary = {};

export const Secondary = {
  args: { variant: 'secondary' },
};

export const Ghost = {
  args: { variant: 'ghost' },
};

export const Outline = {
  args: { variant: 'outline' },
};

export const Danger = {
  args: { variant: 'danger', children: 'Supprimer' },
};

export const Loading = {
  args: { loading: true },
};

export const Disabled = {
  args: { disabled: true },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {['primary', 'secondary', 'ghost', 'outline', 'danger'].map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes = {
  render: () => (
    <div className="flex items-center gap-3">
      {['sm', 'md', 'lg'].map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

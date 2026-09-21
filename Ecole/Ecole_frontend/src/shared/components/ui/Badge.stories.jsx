import Badge from './Badge';

export default {
  title: 'Érudit/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'danger', 'info', 'accent'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: {
    children: 'Actif',
    variant: 'default',
    size: 'md',
  },
};

export const Default = {};

export const Success = {
  args: { variant: 'success', children: 'Payé' },
};

export const Warning = {
  args: { variant: 'warning', children: 'En attente' },
};

export const Danger = {
  args: { variant: 'danger', children: 'En retard' },
};

export const WithDot = {
  args: { variant: 'success', dot: true, children: 'En ligne' },
};

export const Removable = {
  args: { removable: true, onRemove: () => {} },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['default', 'primary', 'success', 'warning', 'danger', 'info', 'accent'].map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

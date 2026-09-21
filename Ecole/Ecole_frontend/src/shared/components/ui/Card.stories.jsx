import Card from './Card';
import Button from './Button';
import Badge from './Badge';

export default {
  title: 'Érudit/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outline', 'flat'],
    },
  },
};

export const Simple = {
  render: () => (
    <Card className="max-w-sm">
      <Card.Body>
        <p>Une carte sans en-tête ni pied — le cas le plus courant.</p>
      </Card.Body>
    </Card>
  ),
};

export const WithHeaderAndFooter = {
  render: () => (
    <Card className="max-w-sm">
      <Card.Header
        title="Paiement en attente"
        action={<Badge variant="warning">En attente</Badge>}
      />
      <Card.Body>
        <Card.Description>
          Scolarité — 1er trimestre, échéance le 15 octobre.
        </Card.Description>
      </Card.Body>
      <Card.Footer>
        <Button size="sm">Confirmer</Button>
        <Button size="sm" variant="outline">Reporter</Button>
      </Card.Footer>
    </Card>
  ),
};

export const Variants = {
  render: () => (
    <div className="grid max-w-2xl grid-cols-2 gap-4">
      {['default', 'elevated', 'outline', 'flat'].map((variant) => (
        <Card key={variant} variant={variant}>
          <Card.Body>
            <Card.Title as="h4">{variant}</Card.Title>
            <Card.Description>variant=&quot;{variant}&quot;</Card.Description>
          </Card.Body>
        </Card>
      ))}
    </div>
  ),
};

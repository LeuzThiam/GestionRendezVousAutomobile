import React from 'react';
import { Badge } from 'react-bootstrap';

export default function StatBadgeGroup({ items }) {
  return (
    <>
      {items.map((item) => (
        <Badge key={item.label} bg={item.bg || 'secondary'} text={item.text} className="app-stat-badge">
          {item.label}: {item.value}
        </Badge>
      ))}
    </>
  );
}

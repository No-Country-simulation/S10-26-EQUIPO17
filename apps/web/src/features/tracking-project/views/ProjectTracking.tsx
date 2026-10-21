import { useParams } from 'react-router-dom';

export function ProjectTracking() {
  const { id } = useParams();
  return <h1>Pieza 3 y 6: Tracking del Proyecto ID: {id}</h1>;
}

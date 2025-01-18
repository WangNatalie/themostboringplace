import React from 'react';
import MapComponent from './components/map.tsx';
import 'leaflet/dist/leaflet.css';

// Modern TypeScript pattern without React.FC
const App = () => {
  return (
    <div className="App" style={{ height: '100vh', width: '100%' }}>
      <MapComponent />
    </div>
  );
};

export default App;
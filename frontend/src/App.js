import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplitView from './pages/SplitView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplitView />} />
        <Route path="*" element={<SplitView />} />
      </Routes>
    </Router>
  );
}

export default App; 
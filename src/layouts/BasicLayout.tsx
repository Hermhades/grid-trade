import React from 'react';
import { Outlet } from 'react-router-dom';

const BasicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Outlet />
      <footer className="text-center text-sm text-gray-400 py-4 mt-4">
        Grid Trade ©2025 Created by H.XY
      </footer>
    </div>
  );
};

export default BasicLayout; 
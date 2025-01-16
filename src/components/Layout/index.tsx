import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content, Footer } = Layout;

const AppLayout: React.FC = () => {
  return (
    <Layout className="min-h-screen">
      <Content className="bg-transparent">
        <Outlet />
      </Content>
      <Footer className="text-center text-gray-600 bg-transparent">
        Grid Trade ©{new Date().getFullYear()} Created by H.XY
      </Footer>
    </Layout>
  );
};

export default AppLayout; 
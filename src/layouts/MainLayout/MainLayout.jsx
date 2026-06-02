import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Topbar from '../../components/Topbar/Topbar';
import BottomNavigation from '../../components/BottomNavigation/BottomNavigation';
import './MainLayout.css';

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="main-layout">
      <Sidebar />

      <div className="main-layout__body">
        <Topbar />
        <main className="main-layout__content" key={pathname}>
          <div className="main-layout__inner">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}

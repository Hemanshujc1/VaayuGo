import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const CustomerLayout = () => {
  return (
    <div className="min-h-screen bg-primary text-primary-text flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 md:ml-72 pb-20 md:pb-0">
        {" "}
        {/* padding bottom for mobile nav */}
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;

import { useLocation } from "react-router-dom";

const RouteTransition = ({ children }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-page-enter">
      {children}
    </div>
  );
};

export default RouteTransition;

import React from "react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="container ">
      <h4>Page Not Found</h4>
      <p className="text-black ">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <div className="text-center">
        <Link to="/" className="btn btn-primary">
          Home
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;

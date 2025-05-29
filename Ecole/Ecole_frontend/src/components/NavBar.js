// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext';

const Navbar = () => {
  const { userRole } = useUser();

  return (
    <nav>
      <Link to="/">Accueil</Link>
      {userRole === 'admin' && <Link to="/admin-dashboard">Dashboard Admin</Link>}
      {userRole === 'ecole' && <Link to="/school-dashboard">Dashboard École</Link>}
      {userRole === 'etudiant' && <Link to="/student-dashboard">Dashboard Étudiant</Link>}
      {/* Ajoutez d'autres liens selon le rôle */}
    </nav>
  );
};

export default Navbar;

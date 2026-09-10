import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MethodologyModal } from '@/components/scoring/MethodologyModal';
import Index from './Index';

export const Methodology: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsOpen(false);
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <Index />
      <MethodologyModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default Methodology;


import React, { useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import Button from '../../UI/Button';
import Modal from '../../UI/Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('E-mail ou senha inválidos.'); // More user-friendly message
    } else {
      setMessage('Login bem-sucedido! Redirecionando...');
      // The onAuthStateChange listener in App.tsx will handle the state change and unmount this component.
      // We can close the modal visually.
      onClose();
    }
    setLoading(false);
  };
  
  // Reset state when modal is closed to avoid showing old errors
  const handleClose = () => {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Acesso Administrativo">
        <div className="p-2">
            <p className="text-center text-gray-400 mb-6">Faça login para gerenciar o sistema.</p>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="email-modal" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  id="email-modal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password-modal" className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <input
                  id="password-modal"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="********"
                  required
                />
              </div>
              
              {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
              {message && <p className="text-green-400 text-sm text-center mb-4">{message}</p>}

              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
        </div>
    </Modal>
  );
};

export default LoginModal;

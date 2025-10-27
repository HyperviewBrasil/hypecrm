import React, { useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import Button from '../../UI/Button';

interface LoginPageProps {
  onNavigateToLanding: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToLanding }) => {
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
      setError(error.message);
    } else {
      setMessage('Login successful! Redirecting...');
      // The onAuthStateChange listener in App.tsx will handle the state change.
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Acesso Administrativo</h1>
        <p className="text-center text-gray-400 mb-8">Faça login para gerenciar suas propostas, contratos e finanças.</p>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
            <input
              id="password"
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
        <div className="text-center mt-6">
          <button onClick={onNavigateToLanding} className="text-sm text-blue-400 hover:underline">
            &larr; Voltar ao Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
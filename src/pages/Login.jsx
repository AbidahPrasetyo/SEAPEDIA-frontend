import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. PROSES LOGIN PERTAMA
      const resLogin = await fetch('https://seapedia-navy.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const dataLogin = await resLogin.json();
      if (!resLogin.ok) throw new Error(dataLogin.message || 'Gagal masuk akun');

      // Tentukan peran default (Pilih BUYER jika ada, jika tidak pilih peran pertamanya)
      const targetRole = dataLogin.user.roles.includes('BUYER') ? 'BUYER' : dataLogin.user.roles[0];

      // 2. PROSES SELECT-ROLE (Mendapatkan Token ActiveRole)
      const resRole = await fetch('https://seapedia-navy.vercel.app/api/auth/select-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dataLogin.token}`
        },
        body: JSON.stringify({ role: targetRole })
      });
      const dataRole = await resRole.json();
      if (!resRole.ok) throw new Error(dataRole.error || 'Gagal memilih peran aktif');

      // 3. SIMPAN TOKEN FINAL
      localStorage.setItem('token', dataRole.token); 
      localStorage.setItem('username', dataLogin.user.username);
      localStorage.setItem('roles', JSON.stringify(dataLogin.user.roles));

      Swal.fire({
        title: 'Akses Diberikan!',
        text: `Selamat datang kembali, Kapten ${dataLogin.user.username}!`,
        icon: 'success',
        confirmButtonColor: '#2563eb',
        timer: 2000
      }).then(() => {
        if (targetRole === 'SELLER') navigate('/seller-dashboard');
        else if (targetRole === 'BUYER') navigate('/dashboard');
        else if (targetRole === 'DRIVER') navigate('/driver-dashboard');
        else if (targetRole === 'ADMIN') navigate('/admin-dashboard');
        else navigate('/');
      });

    } catch (err) {
      Swal.fire('Gagal Masuk', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
          <p className="text-gray-500 mt-2 text-sm">Masukkan identitas pelautmu.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all mt-4">
            {isLoading ? 'Memeriksa...' : 'Log In Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2 flex flex-col">
          <p className="text-sm text-gray-500">
            Belum punya akun? <Link to="/register" className="font-bold text-blue-600 hover:underline">Daftar di sini</Link>
          </p>
          <Link to="/" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-all">Kembali ke Katalog</Link>
        </div>
      </div>
    </div>
  );
}
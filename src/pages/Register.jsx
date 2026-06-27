import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'BUYER' // Peran default
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API index.js milikmu meminta roles dalam bentuk array
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        roles: [formData.role] 
      };

      const response = await fetch('https://seapedia-navy.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan akun');
      }

      // Notifikasi Sukses SweetAlert2
      Swal.fire({
        title: 'Berhasil Mendaftar!',
        text: 'Akun barumu sudah aktif. Silakan masuk (log in) untuk mulai berlayar.',
        icon: 'success',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        navigate('/login'); // Lempar ke halaman login setelah sukses
      });

    } catch (err) {
      Swal.fire('Registrasi Gagal', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
          <p className="text-gray-500 mt-2 text-sm">Daftar dan jadilah bagian dari pelabuhan kami.</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
            <input 
              type="text" 
              required 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all" 
              placeholder="Ketik username unikmu"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Alamat Email</label>
            <input 
              type="email" 
              required 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all" 
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Kata Sandi</label>
            <input 
              type="password" 
              required 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all" 
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Pilih Peranmu</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:border-blue-500 transition-all font-semibold text-gray-700"
            >
              <option value="BUYER">Pembeli (BUYER)</option>
              <option value="SELLER">Penjual (SELLER)</option>
              <option value="DRIVER">Kurir Ekspedisi (DRIVER)</option>
            </select>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all mt-4">
            {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2 flex flex-col">
          <p className="text-sm text-gray-500">
            Sudah punya akun? <Link to="/login" className="font-bold text-blue-600 hover:underline">Log In di sini</Link>
          </p>
          <Link to="/" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-all">Kembali ke Katalog</Link>
        </div>
      </div>
    </div>
  );
}
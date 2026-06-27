import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <-- 1. Import SweetAlert2

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');

    if (token && storedUsername) {
      setActiveUser({ username: storedUsername, roles, token });
    }

    fetch('https://seapedia-navy.vercel.app/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setActiveUser(null);
    // <-- 2. Ganti alert logout
    Swal.fire({
      title: 'Sampai Jumpa!',
      text: 'Kamu telah berhasil keluar dari akun.',
      icon: 'success',
      confirmButtonColor: '#2563eb'
    });
  };

  const handleAddToCart = async (productId) => {
    if (!activeUser || !activeUser.token) {
      // <-- 3. Ganti alert peringatan login
      Swal.fire({
        title: 'Akses Ditolak',
        text: 'Silakan Masuk Akun terlebih dahulu untuk berbelanja.',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      }).then(() => navigate('/login'));
      return;
    }
    if (!activeUser.roles.includes('BUYER')) {
      Swal.fire('Gagal', 'Hanya akun Pembeli (BUYER) yang bisa memasukkan barang ke keranjang.', 'error');
      return;
    }

    setAddingToCart(productId);

    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeUser.token}`
        },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan ke keranjang');
      
      // <-- 4. Ganti alert sukses
      Swal.fire({
        title: 'Masuk Keranjang!',
        text: data.message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      // <-- 5. Ganti alert error dari backend (Single-Store Rule)
      Swal.fire('Peringatan', error.message, 'warning');
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">SEAPEDIA</h1>
          <p className="text-gray-500 mt-1 font-medium">Platform Marketplace Maritim Nusantara</p>
        </div>

        <div className="flex items-center gap-4">
          {activeUser ? (
            <>
              <div className="text-right hidden md:block mr-2">
                <p className="text-sm text-gray-500">Halo, Kapten</p>
                <p className="font-bold text-gray-800">@{activeUser.username}</p>
              </div>
              <Link to={activeUser.roles.includes('SELLER') ? "/seller-dashboard" : activeUser.roles.includes('DRIVER') ? "/driver-dashboard" : activeUser.roles.includes('ADMIN') ? "/admin-dashboard" : "/dashboard"} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md">
                Dasbor Saya
              </Link>
              <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl transition-all border border-rose-100">
                Keluar
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-md shadow-blue-100">
              Masuk Akun
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <p className="text-xl font-bold animate-pulse text-blue-600">Memuat data produk</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-black bg-blue-50 text-blue-600 py-1.5 px-3 rounded-lg uppercase tracking-wider">
                    {product.store ? product.store.name : 'Toko Resmi'}
                  </span>
                  <span className={`text-xs font-bold py-1.5 px-3 rounded-lg ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    Stok: {product.stock}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{product.name}</h2>
                <p className="text-gray-500 text-sm mt-3 line-clamp-3 leading-relaxed">{product.description}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 flex flex-col gap-4">
                <span className="text-2xl font-black text-gray-800">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
                <button 
                  onClick={() => handleAddToCart(product.id)}
                  disabled={addingToCart === product.id || product.stock < 1}
                  className={`w-full font-bold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 ${
                    product.stock < 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                      : addingToCart === product.id
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                  }`}
                >
                  {product.stock < 1 ? 'Stok Habis' : addingToCart === product.id ? 'Memproses...' : '+ Keranjang'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
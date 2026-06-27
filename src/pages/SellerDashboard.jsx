import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview'); 
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [report, setReport] = useState({ totalOrders: 0, totalIncome: 0 });
  const [orders, setOrders] = useState([]);

  const [storeForm, setStoreForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fetchSellerData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const resMe = await fetch('https://seapedia-navy.vercel.app/api/auth/me', { headers });
      const dataMe = await resMe.json();
      setProfile(dataMe.profile);

      const resStore = await fetch('https://seapedia-navy.vercel.app/api/stores/me', { headers });
      if (resStore.status === 404) {
        setStore(null);
        setLoading(false);
        return; 
      }
      const dataStore = await resStore.json();
      setStore(dataStore.data);

      const [resReport, resOrders] = await Promise.all([
        fetch('https://seapedia-navy.vercel.app/api/seller/report', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/seller/orders', { headers })
      ]);
      const dataReport = await resReport.json();
      const dataOrders = await resOrders.json();

      setReport(dataReport.summary || { totalOrders: 0, totalIncome: 0 });
      setOrders(dataOrders.data || []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return navigate('/login');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (!roles.includes('SELLER')) {
      Swal.fire('Akses Ditolak', 'Kamu tidak memiliki izin sebagai Penjual (SELLER).', 'error').then(() => navigate('/'));
      return;
    }
    fetchSellerData();
  }, [navigate, token]);

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/stores', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(storeForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire('Toko Dibuka!', data.message, 'success');
      fetchSellerData();
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(productForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire('Produk Ditambahkan!', data.message, 'success');
      setProductForm({ name: '', description: '', price: '', stock: '' });
      setIsAddingProduct(false);
      fetchSellerData();
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleProcessOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Proses pesanan ini?',
      text: "Sistem akan mencarikan kurir untuk mengantar paket ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Proses!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`https://seapedia-navy.vercel.app/api/seller/orders/${orderId}/process`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Swal.fire('Berhasil!', data.message, 'success');
      fetchSellerData();
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    Swal.fire('Tutup Kedai', 'Berhasil keluar dari Dasbor Penjual.', 'success').then(() => navigate('/'));
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-blue-600 animate-pulse font-bold text-xl">Memuat data...</div>;

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <h2 className="text-3xl font-black text-gray-800 mb-2">Buka Tokomu!</h2>
          <p className="text-gray-500 mb-8 text-sm">Jadilah bagian dari saudagar SEAPEDIA.</p>
          <form onSubmit={handleCreateStore} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Toko</label>
              <input type="text" required value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label>
              <textarea required value={storeForm.description} onChange={e => setStoreForm({...storeForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none" rows="3"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4">Buka Toko</button>
          </form>
          <button onClick={handleLogout} className="mt-6 text-sm font-bold text-gray-400 hover:text-rose-500">Batal & Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">Ruang Penjual</p>
          </div>
          <nav className="p-4 space-y-2">
            {['overview', 'products', 'orders'].map(menu => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all capitalize ${activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {menu === 'overview' ? 'Ringkasan Toko' : menu === 'products' ? 'Etalase Produk' : 'Pesanan Masuk'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-50">Katalog Utama</Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-rose-600 hover:bg-rose-50">Keluar Akun</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-black text-gray-800 capitalize">
            {activeMenu === 'overview' ? 'Ringkasan Toko' : activeMenu === 'products' ? 'Etalase Produk' : 'Pesanan Masuk'}
          </h2>
          <p className="text-gray-500 mt-1">Mengelola Toko: <span className="font-bold text-blue-600">{store.name}</span></p>
        </header>

        {activeMenu === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-lg text-white">
              <h2 className="text-blue-200 font-bold text-sm uppercase tracking-wider">Pendapatan Bersih</h2>
              <p className="text-5xl font-black mt-3">Rp {report.totalIncome.toLocaleString('id-ID')}</p>
              <p className="text-sm mt-4 text-blue-200">*Setelah dipotong diskon. Ongkir ditangani kurir.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-gray-400 font-bold text-sm uppercase tracking-wider">Total Pesanan Diterima</h2>
              <p className="text-5xl font-black text-gray-800 mt-3">{report.totalOrders} <span className="text-xl text-gray-400">Order</span></p>
              <button onClick={() => setActiveMenu('orders')} className="mt-6 text-sm font-bold text-blue-600 hover:underline">Kelola Pesanan &rarr;</button>
            </div>
          </div>
        )}

        {activeMenu === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Daftar Barang Jualanmu</h3>
              <button onClick={() => setIsAddingProduct(!isAddingProduct)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all">
                {isAddingProduct ? 'Batal Tambah' : '+ Tambah Produk'}
              </button>
            </div>
            {isAddingProduct && (
              <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 uppercase">Nama</label><input type="text" required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg mt-1 outline-none" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Harga</label><input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg mt-1 outline-none" /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Deskripsi</label><textarea required value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg mt-1 outline-none" rows="2"></textarea></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Stok</label><input type="number" required value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full px-4 py-2 border rounded-lg mt-1 outline-none" /></div>
                <div className="flex items-end"><button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg">Simpan</button></div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {store.products.map(product => (
                <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="font-black text-emerald-600">Rp {product.price.toLocaleString('id-ID')}</span>
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">Stok: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMenu === 'orders' && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">ID: {order.id.slice(0,8)}</p>
                    <p className="font-bold text-gray-800 text-sm mt-1">Ongkir: Rp {order.shippingCost.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${order.status === 'Sedang Dikemas' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>{order.status}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {order.items.map(i => (<div key={i.id} className="flex justify-between text-sm"><span className="text-gray-600 font-medium">{i.quantity}x {i.product.name}</span></div>))}
                </div>
                {order.status === 'Sedang Dikemas' && (
                  <button onClick={() => handleProcessOrder(order.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md mt-2">Siap Dikirim (Cari Kurir) &rarr;</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('overview'); 
  const token = localStorage.getItem('token');

  // State Data dari API Aslimu
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [cart, setCart] = useState({ id: '', items: [] });
  const [report, setReport] = useState({ totalOrders: 0, totalSpent: 0, data: [] });

  // State untuk Checkout
  const [deliveryMethod, setDeliveryMethod] = useState('Regular');
  const [discountCode, setDiscountCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchAllData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resMe, resWallet, resCart, resReport] = await Promise.all([
        fetch('https://seapedia-navy.vercel.app/api/auth/me', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/wallet', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/cart', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/buyer/report', { headers })
      ]);

      const dataMe = await resMe.json();
      const dataWallet = await resWallet.json();
      const dataCart = await resCart.json();
      const dataReport = await resReport.json();

      setProfile(dataMe.profile);
      setWallet(dataWallet.data || { balance: 0 });
      setCart(dataCart.data || { items: [] });
      setReport(dataReport.summary ? dataReport : { summary: { totalOrders: 0, totalSpent: 0 }, data: [] });
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (!roles.includes('BUYER')) {
      alert("Akses ditolak. Dasbor ini khusus BUYER.");
      navigate('/');
      return;
    }
    fetchAllData();
  }, [navigate, token]);

  // ==========================================
  // FUNGSI AKSI (Sesuai index.js)
  // ==========================================
  const handleTopup = async () => {
    const amountStr = window.prompt('Masukkan nominal Top-Up (Contoh: 50000):');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      fetchAllData(); // Refresh data agar saldo bertambah
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    if (!window.confirm('Yakin ingin membuang barang ini?')) return;
    try {
      const res = await fetch(`https://seapedia-navy.vercel.app/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAllData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) return alert("Keranjang kosong!");
    setCheckoutLoading(true);
    
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ deliveryMethod, discountCode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`${data.message}\nTotal Dibayar: Rp ${data.summary.finalTotal.toLocaleString('id-ID')}\nDiskon Dipakai: ${data.summary.discountType}`);
      setDiscountCode('');
      fetchAllData(); // Refresh untuk update saldo, keranjang kosong, dan riwayat pesanan
      setActiveMenu('orders'); // Langsung arahkan ke tab riwayat pesanan
    } catch (error) {
      alert(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    alert('Berhasil keluar.');
    navigate('/');
  };

  if (loading || !profile) return <div className="min-h-screen bg-gray-50 flex justify-center items-center text-xl animate-pulse text-blue-600">Memuat data...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* SIDEBAR KIRI */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">Ruang Pembeli</p>
          </div>
          <nav className="p-4 space-y-2">
            {['overview', 'cart', 'orders', 'profile'].map(menu => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all capitalize ${activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {menu === 'overview' ? 'Ringkasan Dasbor' : menu === 'cart' ? 'Keranjang Belanja' : menu === 'orders' ? 'Riwayat Pesanan' : 'Profil Akun'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-50">Katalog Utama</Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-rose-600 hover:bg-rose-50">Keluar Akun</button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-black text-gray-800 capitalize">
            {activeMenu === 'overview' ? 'Ringkasan Dasbor' : activeMenu === 'cart' ? 'Keranjang Belanja' : activeMenu === 'orders' ? 'Riwayat Pesanan' : 'Profil Akun'}
          </h2>
          <p className="text-gray-500 mt-1">Selamat datang kembali, Kapten <span className="font-bold text-blue-600">{profile.username}</span>!</p>
        </header>

        {/* 1. MENU OVERVIEW */}
        {activeMenu === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg text-white relative">
              <h2 className="text-blue-200 font-semibold text-sm uppercase tracking-wider">Saldo SEAPAY</h2>
              <p className="text-4xl font-black mt-2">Rp {wallet.balance.toLocaleString('id-ID')}</p>
              <button onClick={handleTopup} className="mt-6 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg w-full transition-all text-sm">+ Isi Saldo</button>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Total Pengeluaran</h2>
              <p className="text-4xl font-black text-rose-600 mt-2">Rp {report.summary.totalSpent.toLocaleString('id-ID')}</p>
              <p className="text-sm font-semibold text-gray-400 mt-4">Dari {report.summary.totalOrders} Transaksi</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Keranjang Aktif</h2>
              <p className="text-4xl font-black text-gray-800 mt-2">{cart.items.length} <span className="text-lg font-bold text-gray-400">Barang</span></p>
              <button onClick={() => setActiveMenu('cart')} className="mt-4 text-sm font-bold text-blue-600 hover:underline">Lihat Detail &rarr;</button>
            </div>
          </div>
        )}

        {/* 2. MENU CART & CHECKOUT (Mengikuti Aturan Checkout Level 4) */}
        {activeMenu === 'cart' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            {cart.items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium">Keranjangmu masih kosong, Kapten!</p>
                <Link to="/" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Mulai Belanja &rarr;</Link>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Daftar Barang */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Barang Bawaan</h3>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                      <div>
                        <h4 className="font-bold text-gray-800">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">Kuantitas: {item.quantity} x Rp {item.product.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-black text-emerald-600">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</p>
                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Panel Checkout Khusus */}
                <div className="w-full lg:w-80 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Pengiriman & Diskon</h3>
                  
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Metode Pengiriman</label>
                  <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none">
                    <option value="Regular">Regular (Rp 10.000)</option>
                    <option value="Next Day">Next Day (Rp 15.000)</option>
                    <option value="Instant">Instant (Rp 20.000)</option>
                  </select>

                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Kode Voucher / Promo</label>
                  <input type="text" placeholder="Ketik kode jika ada..." value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="w-full mb-6 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase" />

                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <p className="text-sm text-gray-500">Saldo Anda: <span className="font-bold text-blue-600">Rp {wallet.balance.toLocaleString('id-ID')}</span></p>
                    <p className="text-xs text-gray-400 italic mt-1">*Total & PPN 12% akan dikalkulasi oleh sistem backend.</p>
                  </div>

                  <button onClick={handleCheckout} disabled={checkoutLoading} className={`w-full font-bold py-3 rounded-xl transition-all ${checkoutLoading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'}`}>
                    {checkoutLoading ? 'Memproses...' : 'Checkout Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MENU ORDERS (Laporan & Riwayat Pesanan) */}
        {activeMenu === 'orders' && (
          <div className="space-y-6">
            {report.data.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center py-16">
                <p className="text-gray-500">Belum ada riwayat pesanan.</p>
              </div>
            ) : (
              report.data.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-wrap justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400">ID PESANAN</p>
                      <p className="font-mono text-sm">{order.id.slice(0,8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'Sedang Dikemas' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Dikembalikan' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {order.items.map(i => (
                      <div key={i.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{i.quantity}x {i.product.name}</span>
                        <span className="font-semibold text-gray-800">Rp {(i.quantity * i.price).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl text-sm flex flex-col gap-1 border border-gray-100">
                     <div className="flex justify-between text-gray-500"><span>Subtotal:</span> <span>Rp {order.subtotal.toLocaleString('id-ID')}</span></div>
                     <div className="flex justify-between text-rose-500"><span>Diskon:</span> <span>- Rp {order.discount.toLocaleString('id-ID')}</span></div>
                     <div className="flex justify-between text-gray-500"><span>Ongkos Kirim:</span> <span>Rp {order.shippingCost.toLocaleString('id-ID')}</span></div>
                     <div className="flex justify-between text-gray-500"><span>PPN 12%:</span> <span>Rp {order.tax.toLocaleString('id-ID')}</span></div>
                     <div className="flex justify-between font-black text-gray-800 text-base mt-2 pt-2 border-t border-gray-200">
                        <span>Total Bayar:</span> <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. MENU PROFILE (Sesuai API get /api/auth/me) */}
        {activeMenu === 'profile' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Detail Akun (Read-Only)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Username</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">@{profile.username}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Alamat Email</p>
                <p className="text-lg font-semibold text-gray-800 mt-1">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Peran Terdaftar</p>
                <p className="text-sm font-semibold text-blue-600 bg-blue-50 py-1 px-3 rounded-lg inline-block mt-1">{profile.roles.join(', ')}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-8 italic">*Sesuai rancangan backend Level 1, profil saat ini tidak dapat diedit melalui API.</p>
          </div>
        )}

      </main>
    </div>
  );
}
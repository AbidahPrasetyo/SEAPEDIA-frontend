import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('monitoring'); 
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [discounts, setDiscounts] = useState({ vouchers: [], promos: [] });

  const [voucherForm, setVoucherForm] = useState({ code: '', discount: '', quota: '', expiresAt: '' });
  const [promoForm, setPromoForm] = useState({ code: '', discount: '', expiresAt: '' });
  const [simulateDays, setSimulateDays] = useState(1);
  const [simulationResult, setSimulationResult] = useState(null);

  const fetchAdminData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resMe, resMon, resDisc] = await Promise.all([
        fetch('https://seapedia-navy.vercel.app/api/auth/me', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/admin/monitoring', { headers }),
        fetch('https://seapedia-navy.vercel.app/api/admin/discounts', { headers })
      ]);
      const dataMe = await resMe.json();
      const dataMon = await resMon.json();
      const dataDisc = await resDisc.json();
      setProfile(dataMe.profile);
      setMonitoring(dataMon.data);
      setDiscounts(dataDisc.data || { vouchers: [], promos: [] });
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => {
    if (!token) return navigate('/login');
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (!roles.includes('ADMIN')) {
      Swal.fire('Akses Terbatas', 'Hanya administrator yang diizinkan masuk ke ruang kendali.', 'error').then(() => navigate('/'));
      return;
    }
    fetchAdminData();
  }, [navigate, token]);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/admin/vouchers', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(voucherForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      Swal.fire('Berhasil!', data.message, 'success');
      setVoucherForm({ code: '', discount: '', quota: '', expiresAt: '' }); 
      fetchAdminData(); 
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/admin/promos', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(promoForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire('Berhasil!', data.message, 'success');
      setPromoForm({ code: '', discount: '', expiresAt: '' }); 
      fetchAdminData(); 
    } catch (error) { Swal.fire('Gagal', error.message, 'error'); }
  };

  const handleSimulateOverdue = async () => {
    const result = await Swal.fire({
      title: 'Jalankan Simulasi Waktu?',
      text: `Waktu server akan dimajukan ${simulateDays} hari. Pesanan yang nyangkut di toko akan otomatis dibatalkan (Refund).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // Warna rose/merah untuk aksi bahaya
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Ya, Majukan!'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('https://seapedia-navy.vercel.app/api/admin/simulate-overdue', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ simulateDays: parseInt(simulateDays) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSimulationResult(data);
      Swal.fire('Simulasi Selesai', data.message, 'success');
      fetchAdminData(); 
    } catch (error) { Swal.fire('Simulasi Gagal', error.message, 'error'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    Swal.fire('Sistem Terkunci', 'Log akses Admin ditutup.', 'info').then(() => navigate('/'));
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center text-blue-600 animate-pulse font-bold text-xl">Membuka Akses Pusat...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-black text-blue-600 tracking-tight">SEAPEDIA</h1>
            <p className="text-xs text-gray-500 font-semibold mt-1 uppercase tracking-wider">Ruang Admin</p>
          </div>
          <nav className="p-4 space-y-2">
            {['monitoring', 'discounts', 'system'].map(menu => (
              <button key={menu} onClick={() => setActiveMenu(menu)} className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all capitalize ${activeMenu === menu ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                {menu === 'monitoring' ? 'Pemantauan Server' : menu === 'discounts' ? 'Manajemen Diskon' : 'Sistem & Simulasi'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl font-semibold text-rose-600 hover:bg-rose-50 transition-all">Kunci Ruangan</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-3xl font-black text-gray-800 capitalize">{activeMenu === 'monitoring' ? 'Pemantauan Server' : activeMenu === 'discounts' ? 'Voucher & Promo' : 'Sistem Kontrol'}</h2>
          <p className="text-gray-500 mt-1">Otoritas: <span className="font-bold text-blue-600">@{profile.username}</span></p>
        </header>

        {activeMenu === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[{ l: 'Total User', v: monitoring.users, c: 'blue' }, { l: 'Toko', v: monitoring.stores, c: 'emerald' }, { l: 'Produk', v: monitoring.products, c: 'purple' }, { l: 'Pesanan', v: monitoring.orders, c: 'amber' }, { l: 'Kurir', v: monitoring.deliveryJobs, c: 'rose' }].map((s, i) => (
                <div key={i} className={`bg-white p-6 rounded-2xl shadow-sm border-t-4 border-${s.c}-500 text-center`}>
                  <p className="text-xs font-bold text-gray-400 uppercase">{s.l}</p>
                  <p className="text-4xl font-black text-gray-800 mt-2">{s.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Status Pesanan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {monitoring.orderStatistics.map((stat, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center"><span className="font-bold text-gray-600">{stat.status}</span><span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg">{stat.count}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'discounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-4">Voucher (Kuota)</h3>
              <form onSubmit={handleCreateVoucher} className="space-y-4 mb-8">
                <input type="text" required value={voucherForm.code} onChange={e=>setVoucherForm({...voucherForm,code:e.target.value})} className="w-full px-3 py-2 border rounded-lg uppercase outline-none focus:border-blue-500" placeholder="KODE VOUCHER" />
                <input type="number" required value={voucherForm.discount} onChange={e=>setVoucherForm({...voucherForm,discount:e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500" placeholder="Potongan (Rp)" />
                <input type="number" required value={voucherForm.quota} onChange={e=>setVoucherForm({...voucherForm,quota:e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500" placeholder="Kuota" />
                <input type="datetime-local" required value={voucherForm.expiresAt} onChange={e=>setVoucherForm({...voucherForm,expiresAt:e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500" />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg">Cetak</button>
              </form>
              <div className="space-y-2">
                {discounts.vouchers.map(v => (<div key={v.id} className="flex justify-between bg-blue-50 p-3 rounded-lg border border-blue-100"><p className="font-black text-blue-700 uppercase">{v.code}</p><p className="font-bold text-emerald-600">-Rp{v.discount}</p></div>))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4 mb-4">Promo (Waktu)</h3>
              <form onSubmit={handleCreatePromo} className="space-y-4 mb-8">
                <input type="text" required value={promoForm.code} onChange={e=>setPromoForm({...promoForm,code:e.target.value})} className="w-full px-3 py-2 border rounded-lg uppercase outline-none focus:border-blue-500" placeholder="KODE PROMO" />
                <input type="number" required value={promoForm.discount} onChange={e=>setPromoForm({...promoForm,discount:e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500" placeholder="Potongan (Rp)" />
                <input type="datetime-local" required value={promoForm.expiresAt} onChange={e=>setPromoForm({...promoForm,expiresAt:e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500" />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg">Sebarkan</button>
              </form>
              <div className="space-y-2">
                {discounts.promos.map(p => (<div key={p.id} className="flex justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100"><p className="font-black text-emerald-700 uppercase">{p.code}</p><p className="font-bold text-emerald-600">-Rp{p.discount}</p></div>))}
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'system' && (
          <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-2">Simulasi Waktu (Overdue)</h3>
            <p className="text-sm text-gray-500 mb-6">Batalkan pesanan yang mengendap otomatis.</p>
            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1">
                <input type="number" min="1" value={simulateDays} onChange={e => setSimulateDays(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 text-lg font-bold focus:outline-none focus:border-rose-500" />
              </div>
              <button onClick={handleSimulateOverdue} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-xl shadow-md">Simulasi</button>
            </div>
            {simulationResult && (
              <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm">
                <p className="text-white mb-2 font-bold">// HASIL SIMULASI //</p>
                <p> {simulationResult.message}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
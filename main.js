const SELLER_WA = '94762452619';
let isAdmin = false;

/* Admin UI */
function updateAdminUI() {
  document.querySelectorAll('.adminOnly').forEach(e => e.style.display = isAdmin ? 'block' : 'none');
  const btn = document.getElementById('adminBtn');
  if (btn) btn.textContent = isAdmin ? 'Logout' : 'Admin';
}

function adminLogin() {
  const pass = prompt('Enter admin password:');
  if (pass === null) return;
  if (pass === 'RAvindu@97') {
    isAdmin = true;
    updateAdminUI();
    alert('Admin enabled');
  } else {
    alert('Wrong password');
  }
}

function adminLogout() {
  if (confirm('Logout admin?')) { isAdmin = false; updateAdminUI(); alert('Admin disabled'); }
}

document.getElementById('adminBtn').onclick = () => { if (isAdmin) adminLogout(); else adminLogin(); }
updateAdminUI();

/* Products & Cart */
function genId() { return 'p_' + Math.random().toString(36).slice(2, 9); }

let products = [
  { id: genId(), name: 'APLB Glutathione Niacinamide Ampoule Serum', cat: 'Face', price: 8500, stock: 10, img: 'images/aplb_glutathione_serum.jpeg' },
  { id: genId(), name: 'Cetaphil Gentle Skin Cleanser For All Skin Types', cat: 'Body', price: 9900, stock: 5, img: 'images/cetaphil_gentle_cleanser.jpeg' },
  { id: genId(), name: 'Dr.G Black Snail Cream', cat: 'Face', price: 10500, stock: 5, img: 'images/drg_black_snail_cream.jpeg' },
  { id: genId(), name: 'Glutathione + Niacinamide Sheet Mask', cat: 'Face', price: 1390, stock: 8, img: 'images/glutathione_niacinamide_mask.jpeg' }
];

if (localStorage.getItem('products')) {
  try { products = JSON.parse(localStorage.getItem('products')); } catch (e) { }
}

let cart = {};
function escapeHtml(s) { return s ? s.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }
function $(id) { return document.getElementById(id); }

/* Categories */
function populateCategories() {
  const set = new Set(['all']);
  products.forEach(p => set.add(p.cat || 'Uncategorized'));
  const sel = $('categoryFilter'); sel.innerHTML = '';
  set.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
}

/* Products rendering */
function renderProducts() {
  populateCategories();
  const q = $('search').value.trim().toLowerCase();
  const cat = $('categoryFilter').value;
  const sort = $('priceSort').value;

  let list = products.slice();
  if (cat && cat !== 'all') list = list.filter(p => (p.cat || '').toLowerCase() === cat.toLowerCase());
  if (q) list = list.filter(p => (p.name).toLowerCase().includes(q));
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'desc') list.sort((a, b) => b.price - a.price);

  const wrap = $('products'); wrap.innerHTML = '';
  list.forEach(p => {
    const d = document.createElement('div'); d.className = 'product card';
    const out = p.stock <= 0 ? '<div style="color:#c00;font-weight:700">Out of stock</div>' : '';
    d.innerHTML = `
      <div class="prod-img">${p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">` : 'No Image'}</div>
      <div class="prod-title">${escapeHtml(p.name)} ${out}</div>
      <div class="prod-desc">LKR ${p.price}</div>
      <div style="margin-top:6px" class="row">
        <label class="small">Qty</label>
        <select class="qtySel" data-id="${p.id}">${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('')}</select>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="addBtn" data-id="${p.id}" ${p.stock<=0?'disabled':''}>Add to cart</button>
        <button class="ghost adminOnly" data-id="${p.id}" style="display:${isAdmin?'inline-block':'none'}">Remove</button>
        <button class="ghost adminOnly" data-id="${p.id}" style="display:${isAdmin?'inline-block':'none'}">Edit</button>
      </div>
    `;
    wrap.appendChild(d);
  });
  attachProductEvents();
}

/* Product events */
function attachProductEvents() {
  document.querySelectorAll('.addBtn').forEach(b => b.onclick = () => {
    const id = b.dataset.id; 
    const qty = Number(b.closest('.product').querySelector('.qtySel').value);
    const p = products.find(x => x.id === id); 
    if (!p) return; 
    if (p.stock < qty) { alert('Not enough stock'); return; }
    if (!cart[id]) cart[id] = { ...p, qty }; else cart[id].qty += qty;
    p.stock -= qty; saveProducts(); renderCart(); renderProducts();
  });

  document.querySelectorAll('.adminOnly.ghost').forEach(b => b.onclick = () => {
    const id = b.dataset.id; 
    products = products.filter(x => x.id !== id); saveProducts(); renderProducts();
  });
}

/* Cart rendering */
function renderCart() {
  const wrap = $('cartList'); wrap.innerHTML = ''; 
  const keys = Object.keys(cart);
  if (keys.length === 0) { wrap.innerHTML = '<div class="small">Your cart is empty</div>'; $('totalCount').innerText = '0'; $('totalPrice').innerText = 'LKR 0'; return; }
  let totalQ = 0, totalP = 0;
  keys.forEach(id => {
    const it = cart[id]; 
    totalQ += it.qty; totalP += Number(it.price) * it.qty;
    const div = document.createElement('div'); div.className = 'cart-item';
    div.innerHTML = `<img src='${it.img || ''}' onerror="this.style.display='none'" /><div style='flex:1'><div><b>${escapeHtml(it.name)}</b></div><div class='row' style='margin-top:6px'><button class='dec' data-id='${id}'>-</button><div style='min-width:28px;text-align:center'>${it.qty}</div><button class='inc' data-id='${id}'>+</button></div></div><button class='ghost removeItem' data-id='${id}'>Remove</button>`;
    wrap.appendChild(div);
  });
  $('totalCount').innerText = String(totalQ); $('totalPrice').innerText = 'LKR ' + totalP; attachCartEvents();
}

/* Cart events */
function attachCartEvents() {
  document.querySelectorAll('.inc').forEach(b => b.onclick = () => {
    const id = b.dataset.id; const p = products.find(x => x.id === id); 
    if (p.stock <= 0) { alert('No more stock'); return; }
    cart[id].qty++; p.stock--; saveProducts(); renderCart(); renderProducts();
  });

  document.querySelectorAll('.dec').forEach(b => b.onclick = () => {
    const id = b.dataset.id; 
    if (cart[id].qty > 1) { cart[id].qty--; const p = products.find(x => x.id === id); p.stock++; saveProducts(); renderCart(); renderProducts(); }
  });

  document.querySelectorAll('.removeItem').forEach(b => b.onclick = () => {
    const id = b.dataset.id; 
    const p = products.find(x => x.id === id); 
    p.stock += cart[id].qty; 
    delete cart[id]; 
    saveProducts(); renderCart(); renderProducts();
  });
}

/* Admin add/reset product */
$('p_image').onchange = async e => {
  const f = e.target.files[0]; 
  if (!f) return; 
  const img = await fileToCompressedDataUrl(f, 800, 0.7); 
  window._pickedImage = img;
}

function fileToCompressedDataUrl(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader(); 
    reader.onload = function (ev) {
      const img = new Image(); 
      img.onload = function () {
        const canvas = document.createElement('canvas'); 
        const ratio = img.width / img.height; 
        let w = img.width; let h = img.height;
        if (w > maxWidth) { w = maxWidth; h = Math.round(w / ratio); }
        canvas.width = w; canvas.height = h; 
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality); resolve(dataUrl);
      }; 
      img.src = ev.target.result;
    }; 
    reader.readAsDataURL(file);
  });
}

$('addProd').onclick = () => {
  const name = $('p_name').value.trim(); 
  const price = Number($('p_price').value); 
  const cat = $('p_cat').value.trim() || 'Uncategorized'; 
  const stock = Number($('p_stock').value) || 0;
  if (!name || !price) { alert('Name and price required'); return; }
  const img = window._pickedImage || null;
  products.unshift({ id: genId(), name, cat, price, stock, img }); 
  saveProducts(); renderProducts(); 
  $('p_name').value = ''; $('p_price').value = ''; $('p_cat').value = ''; $('p_stock').value = ''; $('p_image').value = ''; window._pickedImage = null;
}

$('resetProd').onclick = () => { $('p_name').value = ''; $('p_price').value = ''; $('p_cat').value = ''; $('p_stock').value = ''; $('p_image').value = ''; window._pickedImage = null; }

/* Backup & Restore */
function exportData() {
  const data = { products, cart, timestamp: new Date().toISOString() };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `glowmo-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  alert('Data exported successfully');
}

function importData() { $('importFile').click(); }
$('importFile').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.products || !Array.isArray(data.products)) throw new Error('Invalid format');
      if (confirm('Replace all data with imported backup?')) {
        products = data.products;
        cart = data.cart || {};
        saveProducts(); renderProducts(); renderCart();
        alert('Data imported successfully');
      }
    } catch (err) { alert('Error importing data: ' + err.message); }
  };
  reader.readAsText(f);
  $('importFile').value = '';
}

$('exportData').onclick = exportData;
$('importData').onclick = importData;

function saveProducts() { localStorage.setItem('products', JSON.stringify(products)); }

/* Search, filter, sort events */
$('search').oninput = () => renderProducts();
$('categoryFilter').onchange = () => renderProducts();
$('priceSort').onchange = () => renderProducts();

/* Floating WhatsApp quick button */
$('waQuick').onclick = () => { window.open(`https://wa.me/${SELLER_WA}`, '_blank'); }

/* Place order */
$('placeOrder').onclick = () => {
  if (Object.keys(cart).length === 0) { alert('Cart empty'); return; }
  const name = $('cust_name').value.trim(); const phone = $('cust_phone').value.trim(); const addr = $('cust_addr').value.trim(); const notes = $('cust_notes').value.trim();
  let msg = `*New Order*%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AAddress: ${encodeURIComponent(addr)}%0A%0A*Items:*%0A`;
  Object.values(cart).forEach(i => { msg += `- ${encodeURIComponent(i.name)} (x${i.qty})%0A`; });
  if (notes) msg += `%0ANotes: ${encodeURIComponent(notes)}`;
  window.open(`https://wa.me/${SELLER_WA}?text=${msg}`, '_blank');
  // reset
  $('cust_name').value = ''; $('cust_phone').value = ''; $('cust_addr').value = ''; $('cust_notes').value = ''; cart = {}; saveProducts(); renderCart(); renderProducts();
  // toast
  const t = $('toast'); t.style.display = 'block'; setTimeout(() => t.style.display = 'none', 2200);
}

$('clearCart').onclick = () => { 
  if (confirm('Clear cart?')) { 
    Object.values(cart).forEach(i => { const p = products.find(x => x.id === i.id); if (p) p.stock += i.qty; }); 
    cart = {}; saveProducts(); renderCart(); renderProducts(); 
  } 
}

/* Dark mode toggle */
$('darkToggle').onchange = e => { document.body.setAttribute('data-theme', e.target.checked ? 'dark' : ''); }

/* Init */
renderProducts(); renderCart(); populateCategories();

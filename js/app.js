// ==========================================
// 1. SHEETDB CONFIG & MASTER DATA
// ==========================================
const SHEETDB_URL = "https://sheetdb.io/api/v1/sjvetodglgyjj";

// Data Source (Default fallback agar internet slow ho)
let civicIssues = typeof lucknowCivicData !== 'undefined' ? [...lucknowCivicData] : [];
let currentCategory = 'all';
let currentWard = 'all';

// ==========================================
// 2. INITIALIZE LEAFLET MAP
// ==========================================
const map = L.map('map', { zoomControl: false }).setView([26.8467, 80.9462], 12);
L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© RebuildIndia Open Data'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// ==========================================
// 3. RENDER MAP MARKERS
// ==========================================
function renderMapMarkers(data) {
    markersLayer.clearLayers();

    data.forEach(item => {
        let pinClass = 'pulse-red';
        let statusTag = '<span class="text-red-600 font-bold">🔴 Open</span>';

        if (item.status === 'in-progress') {
            pinClass = 'pulse-yellow';
            statusTag = '<span class="text-yellow-600 font-bold">🟡 In Action</span>';
        } else if (item.status === 'resolved') {
            pinClass = 'pulse-green';
            statusTag = '<span class="text-emerald-600 font-bold">🟢 Resolved</span>';
        }

        const customIcon = L.divIcon({
            className: 'custom-pin',
            html: `<div class="${pinClass}"></div>`,
            iconSize: [14, 14]
        });

        const lat = parseFloat(item.lat) || 26.8467;
        const lng = parseFloat(item.lng) || 80.9462;

        const marker = L.marker([lat, lng], { icon: customIcon });

        const popupContent = `
            <div class="font-sans text-xs w-48">
                <img src="${item.image}" class="w-full h-20 object-cover rounded-lg mb-2" onerror="this.src='https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500'">
                <h4 class="font-bold text-slate-800 text-sm leading-tight">${item.title}</h4>
                <p class="text-slate-500 mt-1">📍 ${item.location} (${item.ward || 'Lucknow'})</p>
                <div class="flex justify-between items-center my-2">
                    ${statusTag}
                    <span class="text-slate-400 font-semibold">👍 ${item.upvotes || 1}</span>
                </div>
                <button onclick="tweetAuthority('${item.title}', '${item.location}', '${item.dept || '@lucknow_lmc'}')" class="w-full bg-[#1DA1F2] hover:bg-sky-600 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                    <i class="fa-brands fa-x-twitter"></i> Tweet Authority
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

// ==========================================
// 4. RENDER CITIZEN ACTIVITY FEED
// ==========================================
function renderFeed(data) {
    const feedContainer = document.getElementById('activityFeed');
    if (!feedContainer) return;

    feedContainer.innerHTML = '';

    if (data.length === 0) {
        feedContainer.innerHTML = `
            <div class="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <p class="text-slate-400 text-sm font-semibold">Koi issue nahi mila is category mein.</p>
                <button onclick="filterCategory('all')" class="mt-2 text-xs text-brand-600 font-bold hover:underline">Show All</button>
            </div>
        `;
        return;
    }

    data.forEach(item => {
        let badge = `<span class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🔴 OPEN</span>`;
        if (item.status === 'in-progress') badge = `<span class="bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🟡 ACTION</span>`;
        if (item.status === 'resolved') badge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🟢 RESOLVED</span>`;

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-semibold text-slate-400">📍 ${item.ward || 'Lucknow'} • ${item.timeAgo || 'Recently'}</span>
                    ${badge}
                </div>
                <h3 class="font-bold text-slate-900 text-sm mb-1">${item.title}</h3>
                <p class="text-xs text-slate-500 mb-3">${item.location}</p>
                <div class="rounded-xl overflow-hidden aspect-video bg-slate-100 mb-3">
                    <img src="${item.image}" alt="Evidence" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500'">
                </div>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-100">
                <button onclick="upvoteIssue(this, ${item.upvotes || 1})" class="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 transition cursor-pointer">
                    <i class="fa-regular fa-thumbs-up"></i>
                    <span>${item.upvotes || 1}</span>
                </button>
                <button onclick="tweetAuthority('${item.title}', '${item.location}', '${item.dept || '@lucknow_lmc'}')" class="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer">
                    <i class="fa-brands fa-x-twitter"></i> Tweet ${item.dept || '@lucknow_lmc'}
                </button>
            </div>
        `;
        feedContainer.appendChild(card);
    });

    // Update Counters
    const openEl = document.getElementById('openCount');
    const progEl = document.getElementById('progressCount');
    const resEl = document.getElementById('resolvedCount');

    if (openEl) openEl.innerText = civicIssues.filter(i => i.status === 'open').length;
    if (progEl) progEl.innerText = civicIssues.filter(i => i.status === 'in-progress').length;
    if (resEl) resEl.innerText = civicIssues.filter(i => i.status === 'resolved').length;
}

// ==========================================
// 5. LOAD LIVE DATA FROM GOOGLE SHEETS
// ==========================================
async function loadIssuesFromDatabase() {
    try {
        const res = await fetch(SHEETDB_URL);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
            civicIssues = data.map(item => ({
                ...item,
                lat: parseFloat(item.lat) || 26.8467,
                lng: parseFloat(item.lng) || 80.9462,
                upvotes: parseInt(item.upvotes) || 1,
                dept: item.dept || '@lucknow_lmc'
            }));

            applyFilters();
            console.log("✅ Google Sheet data loaded successfully!");
        }
    } catch (err) {
        console.warn("SheetDB load error:", err);
    }
}

// ==========================================
// 6. FILTERS & SEARCH
// ==========================================
function applyFilters() {
    let filtered = civicIssues;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(i => i.category === currentCategory);
    }

    if (currentWard !== 'all') {
        filtered = filtered.filter(i => (i.ward || '').toLowerCase() === currentWard.toLowerCase());
    }

    renderMapMarkers(filtered);
    renderFeed(filtered);
}

function filterCategory(category, scrollToMap = false) {
    currentCategory = category;

    document.querySelectorAll('.category-pill').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white');
        btn.classList.add('bg-slate-100', 'text-slate-700');
    });

    const activePills = document.querySelectorAll('.category-pill');
    activePills.forEach(pill => {
        if (pill.getAttribute('onclick')?.includes(`'${category}'`)) {
            pill.classList.add('bg-slate-900', 'text-white');
            pill.classList.remove('bg-slate-100', 'text-slate-700');
        }
    });

    applyFilters();

    if (scrollToMap) {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function filterByWard(ward) {
    currentWard = ward;
    applyFilters();

    if (ward !== 'all') {
        const found = civicIssues.find(i => (i.ward || '').toLowerCase() === ward.toLowerCase());
        if (found) map.flyTo([found.lat, found.lng], 14);
    }
}

// ==========================================
// 7. UPVOTE & MULTI-SOCIAL ESCALATION ENGINE
// ==========================================
let activeShareItem = { title: '', location: '', dept: '' };

function upvoteIssue(btn, count) {
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    if (!btn.classList.contains('text-brand-600')) {
        btn.classList.add('text-brand-600');
        icon.classList.replace('fa-regular', 'fa-solid');
        span.innerText = count + 1;
    }
}

// 1. Open Share Modal
function openShareModal(title, location, dept) {
    activeShareItem = { title, location, dept };
    document.getElementById('shareIssueTitle').innerText = title;
    document.getElementById('shareIssueLocation').innerText = `📍 ${location}`;
    document.getElementById('shareModal').classList.remove('hidden');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.add('hidden');
    document.getElementById('copyBtnText').innerText = "Copy Link";
}

// 2. Share to Specific Platforms
function shareTo(platform) {
    const siteUrl = window.location.href;
    const msg = `🚨 Civic Issue in Lucknow!\n\nIssue: ${activeShareItem.title}\n📍 Location: ${activeShareItem.location}\n\nCc: ${activeShareItem.dept} @DMLucknow @lucknow_lmc please take action.\n\nTrack Live on RebuildIndia: ${siteUrl}`;
    const encodedMsg = encodeURIComponent(msg);
    const encodedUrl = encodeURIComponent(siteUrl);

    let shareLink = "";

    switch(platform) {
        case 'whatsapp':
            shareLink = `https://api.whatsapp.com/send?text=${encodedMsg}`;
            break;
        case 'twitter':
            shareLink = `https://twitter.com/intent/tweet?text=${encodedMsg}`;
            break;
        case 'facebook':
            shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`;
            break;
        case 'telegram':
            shareLink = `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`;
            break;
        case 'linkedin':
            shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
            break;
    }

    if (shareLink) window.open(shareLink, '_blank');
}

// 3. Copy Link to Clipboard
function copyIssueLink() {
    const shareText = `🚨 Civic Issue: ${activeShareItem.title} at ${activeShareItem.location}. Track on: ${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
        document.getElementById('copyBtnText').innerText = "Copied! ✅";
        setTimeout(() => {
            document.getElementById('copyBtnText').innerText = "Copy Link";
        }, 2000);
    });
}

// 4. Native Mobile Share (Instagram, Snapchat, SMS)
function nativeMobileShare() {
    if (navigator.share) {
        navigator.share({
            title: `Rebuild India: ${activeShareItem.title}`,
            text: `🚨 Civic Issue: ${activeShareItem.title} at ${activeShareItem.location}. Cc: ${activeShareItem.dept}`,
            url: window.location.href
        }).catch(err => console.log('Share dismissed'));
    } else {
        copyIssueLink();
    }
}

function tweetAuthority(title, location, dept) {
    const text = encodeURIComponent(`🚨 Civic Problem Reported in Lucknow!\n\nIssue: ${title}\n📍 Location: ${location}\n\nCc: ${dept} @DMLucknow @lucknow_lmc please look into this.`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

// ==========================================
// 8. MODAL, CAMERA, REAL GPS & GOOGLE SHEETS
// ==========================================
let capturedLat = 26.8467;
let capturedLng = 80.9462;
let capturedImage = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500";

// Modal Open/Close
function openReportModal() {
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}


// 1. Photo Live Preview + Auto-Compressor (Under 30KB)
function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Canvas bana kar photo ka size chhota karo
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Max width 400px rakho taaki Google Sheet mein aaram se fit ho
                const maxWidth = 400;
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Low-size compressed image (Quality 0.5)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
                
                const preview = document.getElementById('imagePreview');
                const placeholder = document.getElementById('photoPlaceholder');
                preview.src = compressedBase64;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
                
                // Save light-weight photo for Google Sheets
                capturedImage = compressedBase64;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 2. Real GPS Auto-Detect
function getRealGPS() {
    const statusText = document.getElementById('gpsStatusText');
    const coordsText = document.getElementById('gpsCoordsText');

    if (navigator.geolocation) {
        statusText.innerText = "Locating...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                capturedLat = position.coords.latitude.toFixed(6);
                capturedLng = position.coords.longitude.toFixed(6);
                statusText.innerText = "GPS Captured ✅";
                coordsText.innerText = `📍 Exact GPS: ${capturedLat}, ${capturedLng}`;
                coordsText.classList.replace('text-slate-400', 'text-emerald-600');
            },
            (error) => {
                alert("GPS Permission Denied. Aap manually location likh sakte hain.");
                statusText.innerText = "Retry GPS";
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("Aapka browser geolocation support nahi karta.");
    }
}

// 3. Form Submit to Google Sheets
async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const titleInput = document.getElementById('modalTitle');
    const categoryInput = document.getElementById('modalCategory');
    const locationInput = document.getElementById('modalLocation');

    submitBtn.innerText = "Saving to Database...";
    submitBtn.disabled = true;

    const newIssue = {
        id: "LKO-" + Math.floor(100 + Math.random() * 900),
        title: titleInput.value || "Civic Complaint",
        category: categoryInput.value || "infra",
        ward: locationInput.value || "Lucknow",
        location: locationInput.value || "Lucknow Location",
        lat: capturedLat,
        lng: capturedLng,
        status: "open",
        upvotes: 1,
        dept: "@lucknow_lmc",
        image: capturedImage
    };

    try {
        await fetch(SHEETDB_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: [newIssue] })
        });

        civicIssues.unshift(newIssue);
        applyFilters();
        closeReportModal();

        titleInput.value = '';
        locationInput.value = '';

        alert("✅ Real GPS aur Photo ke sath Complaint Google Sheet mein Save ho gayi!");
    } catch (err) {
        alert("Save Error: " + err.message);
    } finally {
        submitBtn.innerText = "Submit & Tweet Authority";
        submitBtn.disabled = false;
    }
}

// ==========================================
// 9. INITIAL STARTUP
// ==========================================
renderMapMarkers(civicIssues);
renderFeed(civicIssues);
loadIssuesFromDatabase();

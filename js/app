// SheetDB URL (Apni link yahan daalo)
const SHEETDB_URL = "https://sheetdb.io/api/v1/sjvetodglgyjj";

// Google Sheet se live data uthane ka function
async function loadIssuesFromDatabase() {
    if (SHEETDB_URL.includes("sjvetodglgyjj")) return;
    try {
        const res = await fetch(SHEETDB_URL);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            currentIssues = data.map(item => ({
                ...item,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lng),
                upvotes: parseInt(item.upvotes) || 1
            }));
            applyFilters();
        }
    } catch (err) {
        console.warn("SheetDB load error:", err);
    }
}




// 1. Initialize Leaflet Map Centered on Lucknow
const map = L.map('map', { zoomControl: false }).setView([26.8467, 80.9462], 12);

// Add Top-Right Zoom Control
L.control.zoom({ position: 'topright' }).addTo(map);

// OpenStreetMap Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© FixLucknow Open Data'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// 2. Render Markers on Map
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

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });

        // Popup Card Template
        const popupContent = `
            <div class="font-sans text-xs w-48">
                <img src="${item.image}" class="w-full h-20 object-cover rounded-lg mb-2">
                <h4 class="font-bold text-slate-800 text-sm leading-tight">${item.title}</h4>
                <p class="text-slate-500 mt-1">📍 ${item.location}</p>
                <div class="flex justify-between items-center my-2">
                    ${statusTag}
                    <span class="text-slate-400 font-semibold">👍 ${item.upvotes}</span>
                </div>
                <button onclick="tweetAuthority('${item.title}', '${item.location}', '${item.dept}')" class="w-full bg-[#1DA1F2] hover:bg-sky-600 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                    <i class="fa-brands fa-x-twitter"></i> Tweet Authority
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

// 3. Render Citizen Feed Cards
function renderFeed(data) {
    const feedContainer = document.getElementById('activityFeed');
    feedContainer.innerHTML = '';

    data.forEach(item => {
        let badge = `<span class="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🔴 OPEN</span>`;
        if (item.status === 'in-progress') badge = `<span class="bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🟡 ACTION</span>`;
        if (item.status === 'resolved') badge = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🟢 RESOLVED</span>`;

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-semibold text-slate-400">📍 ${item.ward} • ${item.timeAgo}</span>
                    ${badge}
                </div>
                <h3 class="font-bold text-slate-900 text-sm mb-1">${item.title}</h3>
                <p class="text-xs text-slate-500 mb-3">${item.location}</p>
                <div class="rounded-xl overflow-hidden aspect-video bg-slate-100 mb-3">
                    <img src="${item.image}" alt="Evidence" class="w-full h-full object-cover">
                </div>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-slate-100">
                <button onclick="upvoteIssue(this, ${item.upvotes})" class="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 transition">
                    <i class="fa-regular fa-thumbs-up"></i>
                    <span>${item.upvotes}</span>
                </button>
                <button onclick="tweetAuthority('${item.title}', '${item.location}', '${item.dept}')" class="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                    <i class="fa-brands fa-x-twitter"></i> Tweet ${item.dept}
                </button>
            </div>
        `;
        feedContainer.appendChild(card);
    });

    // Update Counters
    document.getElementById('openCount').innerText = lucknowCivicData.filter(i => i.status === 'open').length;
    document.getElementById('progressCount').innerText = lucknowCivicData.filter(i => i.status === 'in-progress').length;
    document.getElementById('resolvedCount').innerText = lucknowCivicData.filter(i => i.status === 'resolved').length;
}

// 4. Filters (Category & Ward)
function filterCategory(category) {
    document.querySelectorAll('.category-pill').forEach(btn => btn.classList.remove('bg-slate-900', 'text-white'));
    
    let filtered = lucknowCivicData;
    if (category !== 'all') {
        filtered = lucknowCivicData.filter(i => i.category === category);
    }
    renderMapMarkers(filtered);
    renderFeed(filtered);
}

function filterByWard(ward) {
    let filtered = lucknowCivicData;
    if (ward !== 'all') {
        filtered = lucknowCivicData.filter(i => i.ward === ward);
        // Pan map to ward area
        if (filtered.length > 0) map.panTo([filtered[0].lat, filtered[0].lng]);
    }
    renderMapMarkers(filtered);
    renderFeed(filtered);
}

// 5. Upvote Interaction
function upvoteIssue(btn, count) {
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    icon.classList.replace('fa-regular', 'fa-solid');
    btn.classList.add('text-brand-600');
    span.innerText = count + 1;
}

// 6. Tweet Generator (Action Trigger)
function tweetAuthority(title, location, dept) {
    const text = encodeURIComponent(`🚨 Civic Issue Reported in Lucknow!\n\nIssue: ${title}\n📍 Location: ${location}\n\nCc: ${dept} @DMLucknow @lucknow_lmc please look into this on priority.`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

// 7. Modal Handlers
function openReportModal() {
    document.getElementById('reportModal').classList.remove('hidden');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

function handleFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('modalTitle').value;
    const category = document.getElementById('modalCategory').value;

    const newIssue = {
        id: "LKO-" + Math.floor(100 + Math.random() * 900),
        title: title,
        category: category,
        categoryName: "Civic Issue",
        ward: "Gomti Nagar",
        location: "Gomti Nagar Main Road",
        lat: 26.8500 + (Math.random() - 0.5) * 0.02,
        lng: 80.9500 + (Math.random() - 0.5) * 0.02,
        status: "open",
        upvotes: 1,
        timeAgo: "Just now",
        dept: "@lucknow_lmc",
        image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500"
    };

    lucknowCivicData.unshift(newIssue);
    // Google Sheet mein direct naya issue bhejo
    if (!SHEETDB_URL.includes("sjvetodglgyjj")) {
        fetch(SHEETDB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [newIssue] })
        }).catch(err => console.warn("SheetDB save error:", err));
    }
    renderMapMarkers(lucknowCivicData);
    renderFeed(lucknowCivicData);
    closeReportModal();
    alert("✅ Issue reported successfully & added to Live Heatmap!");
}

// Initial Run
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderFeed(currentIssues);
    loadIssuesFromDatabase(); // <-- Bas ye 1 line add kar do
});
renderMapMarkers(lucknowCivicData);
renderFeed(lucknowCivicData);

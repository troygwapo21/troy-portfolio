/**
 * Troy P. Villaruel — Personal Portfolio & Live Cloud Video Admin Script
 * Handles smooth scroll animations, dynamic cloud video/project loading,
 * cinema video player modal, and encrypted GitHub-backed Admin CMS.
 */

const GITHUB_OWNER = 'troygwapo21';
const GITHUB_REPO = 'troy-portfolio';
const GITHUB_BRANCH = 'main';

let allProjects = [];
let currentFilter = 'all';
let adminToken = sessionStorage.getItem('troy_admin_token') || null;
let scrollObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  // 0. Maintain exact desktop side-by-side structure on mobile / narrow viewports
  const applyDesktopScale = () => {
    if (document.body.classList.contains('is-admin-domain')) {
      document.body.style.zoom = '1';
      return;
    }
    const vw = document.documentElement.clientWidth || window.innerWidth;
    if (vw < 1200) {
      document.body.style.zoom = String(vw / 1220);
    } else {
      document.body.style.zoom = '1';
    }
  };
  applyDesktopScale();
  window.addEventListener('resize', applyDesktopScale, { passive: true });

  // 1. Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Smooth Scroll Fade-In Observer (IntersectionObserver)
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach((el) => scrollObserver.observe(el));

  // 3. Navbar scroll state & Active section link highlight
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const handleScroll = () => {
    if (window.scrollY > 24) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let currentSection = 'home';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 4. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinksContainer = document.getElementById('navLinks');

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('open');
      });
    });
  }

  // 5. Projects Done Filter Tabs
  const filterBtns = document.querySelectorAll('.filter-btn:not(.admin-trigger-btn)');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      applyFilter();
    });
  });

  // 6. Load Projects from Cloud (GitHub API / data/projects.json)
  loadProjects();

  // 7. Setup Cinema Video Modal & Admin Panel Events
  initVideoModal();
  initAdminPanel();

  const isAdminHost =
    window.location.hostname.includes('troy-portfolio-admin') ||
    window.location.hash === '#admin';

  if (isAdminHost) {
    document.body.classList.add('is-admin-domain');
    document.title = 'Troy P. Villaruel | Admin Studio';
    openAdminModal();
  }
});

/* ================= LOAD & RENDER PROJECTS ================= */
async function loadProjects() {
  try {
    // Fetch live from GitHub API (zero cache delay) with fallback to local file
    let res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/projects.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
      { headers: { Accept: 'application/vnd.github.v3.raw' }, cache: 'no-store' }
    );
    if (!res.ok) {
      res = await fetch(`data/projects.json?t=${Date.now()}`, { cache: 'no-store' });
    }
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        allProjects = data;
        renderProjectsGrid();
        renderAdminProjectsList();
      }
    }
  } catch (err) {
    console.warn('Using default embedded projects:', err);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isDirectVideoFile(url) {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0];
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('raw.githubusercontent.com') ||
    lower.includes('cdn.jsdelivr.net')
  );
}

function renderProjectsGrid() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.innerHTML = allProjects
    .map((proj, idx) => {
      const cat = proj.category || 'video';
      const thumbClass =
        cat === 'affiliate' ? 'thumb-affiliate' : cat === 'vibecode' ? 'thumb-code' : 'thumb-video';
      const badge =
        proj.badge ||
        (cat === 'affiliate' ? 'Affiliate Campaign' : cat === 'vibecode' ? 'Vibe Coding' : 'Video Editing');
      const hasVideo = Boolean(proj.videoUrl && proj.videoUrl.trim());
      const directVideo = isDirectVideoFile(proj.videoUrl);
      const tags = Array.isArray(proj.tags) ? proj.tags : [];

      let thumbInner = '';
      if (hasVideo && directVideo) {
        thumbInner = `
          <video class="card-video-preview" src="${escapeHtml(proj.videoUrl)}" muted loop playsinline preload="metadata"></video>
          <div class="thumb-art">
            <div class="play-circle">▶</div>
          </div>
          <span class="video-live-pill">🎬 Click to Watch</span>
        `;
      } else if (hasVideo) {
        thumbInner = `
          <div class="thumb-art">
            <div class="play-circle">▶</div>
          </div>
          <span class="video-live-pill">🎬 Watch Video</span>
        `;
      } else if (cat === 'affiliate') {
        thumbInner = `<div class="thumb-art"><div class="chart-up">📈 +Conversions</div></div>`;
      } else if (cat === 'vibecode') {
        thumbInner = `<div class="thumb-art"><code class="code-snippet">&lt;VibeCode /&gt;</code></div>`;
      } else {
        thumbInner = `
          <div class="thumb-art">
            <div class="play-circle">▶</div>
            <div class="timeline-bars"><span></span><span></span><span></span></div>
          </div>
        `;
      }

      const hiddenClass = currentFilter === 'all' || currentFilter === cat ? '' : 'hidden';

      return `
        <article class="project-card fade-in is-visible ${hasVideo ? 'has-video-card' : ''} ${hiddenClass}"
                 data-category="${escapeHtml(cat)}"
                 data-project-id="${escapeHtml(proj.id)}"
                 style="--delay: ${(idx % 3) * 0.08}s;">
          <div class="project-thumb ${thumbClass}" data-play-id="${hasVideo ? escapeHtml(proj.id) : ''}">
            <span class="project-badge">${escapeHtml(badge)}</span>
            ${thumbInner}
          </div>
          <div class="project-body">
            <h3>${escapeHtml(proj.title)}</h3>
            <p>${escapeHtml(proj.description)}</p>
            <div class="project-meta">
              ${tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
            </div>
            ${
              hasVideo || proj.externalUrl
                ? `<div class="project-card-actions">
                    ${
                      hasVideo
                        ? `<button type="button" class="btn-card-action primary" data-play-id="${escapeHtml(proj.id)}">▶ Watch Video</button>`
                        : ''
                    }
                    ${
                      proj.externalUrl
                        ? `<a href="${escapeHtml(proj.externalUrl)}" target="_blank" rel="noopener noreferrer" class="btn-card-action">🔗 Open Link →</a>`
                        : ''
                    }
                  </div>`
                : ''
            }
          </div>
        </article>
      `;
    })
    .join('');

  // Hover video preview & click to open Cinema Video Modal
  grid.querySelectorAll('.project-card').forEach((card) => {
    const vid = card.querySelector('video.card-video-preview');
    if (vid) {
      card.addEventListener('mouseenter', () => vid.play().catch(() => {}));
      card.addEventListener('mouseleave', () => {
        vid.pause();
        vid.currentTime = 0;
      });
    }
  });

  grid.querySelectorAll('[data-play-id]').forEach((el) => {
    const playId = el.getAttribute('data-play-id');
    if (playId) {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const proj = allProjects.find((p) => p.id === playId);
        if (proj) openVideoModal(proj);
      });
    }
  });
}

function applyFilter() {
  const cards = document.querySelectorAll('#projectsGrid .project-card');
  cards.forEach((card) => {
    const cat = card.getAttribute('data-category');
    const matches = currentFilter === 'all' || cat === currentFilter;
    if (matches) {
      card.classList.remove('hidden');
      card.classList.remove('is-visible');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => card.classList.add('is-visible'));
      });
    } else {
      card.classList.add('hidden');
    }
  });
}

/* ================= CINEMA VIDEO MODAL ================= */
function initVideoModal() {
  const modal = document.getElementById('videoModal');
  const closeBtn = document.getElementById('closeVideoModal');
  const container = document.getElementById('videoPlayerContainer');

  const closeModal = () => {
    modal.classList.add('hidden');
    container.innerHTML = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

function getEmbedHtml(videoUrl) {
  if (!videoUrl) return '';
  if (isDirectVideoFile(videoUrl)) {
    return `<video src="${escapeHtml(videoUrl)}" controls autoplay playsinline></video>`;
  }

  // YouTube / YouTube Shorts
  const ytMatch = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Google Drive video preview
  const driveMatch = videoUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `<iframe src="https://drive.google.com/file/d/${driveMatch[1]}/preview" allow="autoplay" allowfullscreen></iframe>`;
  }

  // External Social Video (TikTok / FB Reel / IG Reel)
  return `
    <div style="padding: 48px 24px; text-align: center; color: #fff;">
      <p style="margin-bottom: 16px; color: #cbd5e1;">This video is hosted on an external social platform:</p>
      <a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
        ▶ Watch Video in New Tab →
      </a>
    </div>
  `;
}

function openVideoModal(proj) {
  const modal = document.getElementById('videoModal');
  const badgeEl = document.getElementById('videoModalBadge');
  const titleEl = document.getElementById('videoModalTitle');
  const descEl = document.getElementById('videoModalDesc');
  const extBtn = document.getElementById('videoModalExternalBtn');
  const container = document.getElementById('videoPlayerContainer');

  badgeEl.textContent = proj.badge || 'Video Project';
  titleEl.textContent = proj.title || '';
  descEl.textContent = proj.description || '';
  container.innerHTML = getEmbedHtml(proj.videoUrl);

  if (proj.externalUrl) {
    extBtn.href = proj.externalUrl;
    extBtn.classList.remove('hidden');
  } else {
    extBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

/* ================= WEBCRYPTO VAULT (AES-256-GCM) ================= */
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

async function deriveAesKey(password, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey'
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function unlockVaultWithPassword(password) {
  let res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/admin-vault.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
    { headers: { Accept: 'application/vnd.github.v3.raw' }, cache: 'no-store' }
  );
  if (!res.ok) {
    res = await fetch(`data/admin-vault.json?t=${Date.now()}`, { cache: 'no-store' });
  }
  const vault = await res.json();
  const salt = base64ToBytes(vault.salt);
  const iv = base64ToBytes(vault.iv);
  const ciphertext = base64ToBytes(vault.ciphertext);

  const key = await deriveAesKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

async function encryptVaultWithPassword(password, token) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  );
  return {
    v: 1,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(encrypted)
  };
}

/* ================= GITHUB CLOUD API HELPERS ================= */
async function githubUpsertFile(filePath, contentBase64, commitMessage, onProgress) {
  // 1. Check if file already exists to get its SHA
  let existingSha = null;
  const checkRes = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        Accept: 'application/vnd.github+json'
      }
    }
  );
  if (checkRes.ok) {
    const existing = await checkRes.json();
    existingSha = existing.sha;
  }

  // 2. Upload via XMLHttpRequest so we get real-time upload progress for videos
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'PUT',
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`
    );
    xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
    xhr.setRequestHeader('Accept', 'application/vnd.github+json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Cloud upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading to cloud.'));

    const payload = {
      message: commitMessage,
      content: contentBase64,
      branch: GITHUB_BRANCH
    };
    if (existingSha) payload.sha = existingSha;

    xhr.send(JSON.stringify(payload));
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveProjectsToCloud(commitMsg) {
  const jsonStr = JSON.stringify(allProjects, null, 2);
  const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));
  await githubUpsertFile('data/projects.json', contentBase64, commitMsg);
}

/* ================= ADMIN PANEL CONTROLLER ================= */
function openAdminModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.remove('hidden');
  updateAdminViewState();
}

function updateAdminViewState() {
  const loginView = document.getElementById('adminLoginView');
  const dashView = document.getElementById('adminDashboardView');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const changePassBtn = document.getElementById('adminChangePassBtn');

  if (adminToken) {
    loginView.classList.add('hidden');
    dashView.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    changePassBtn.classList.remove('hidden');
    renderAdminProjectsList();
  } else {
    loginView.classList.remove('hidden');
    dashView.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    changePassBtn.classList.add('hidden');
  }
}

function initAdminPanel() {
  const openTop = document.getElementById('openAdminBtnTop');
  const openFooter = document.getElementById('openAdminBtnFooter');
  const closeBtn = document.getElementById('closeAdminModal');
  const modal = document.getElementById('adminModal');
  const loginForm = document.getElementById('adminLoginForm');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const changePassBtn = document.getElementById('adminChangePassBtn');
  const projectForm = document.getElementById('projectForm');
  const videoFileInput = document.getElementById('projVideoFile');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (openTop) openTop.addEventListener('click', openAdminModal);
  if (openFooter) openFooter.addEventListener('click', openAdminModal);
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // 1. Admin Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passInput = document.getElementById('adminPasswordInput');
      const errBox = document.getElementById('adminLoginError');
      const loginBtn = document.getElementById('adminLoginBtn');

      errBox.classList.add('hidden');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Verifying Password...';

      try {
        const token = await unlockVaultWithPassword(passInput.value);
        adminToken = token.trim();
        sessionStorage.setItem('troy_admin_token', adminToken);
        passInput.value = '';
        updateAdminViewState();
      } catch (err) {
        errBox.textContent = '❌ Invalid Admin Password. Please try again.';
        errBox.classList.remove('hidden');
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Unlock Admin Dashboard →';
      }
    });
  }

  // 2. Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      adminToken = null;
      sessionStorage.removeItem('troy_admin_token');
      updateAdminViewState();
    });
  }

  // 3. Change Admin Password
  if (changePassBtn) {
    changePassBtn.addEventListener('click', async () => {
      const newPass = prompt('Enter your new Admin Password (minimum 4 characters):');
      if (!newPass || newPass.trim().length < 4) return;
      try {
        changePassBtn.textContent = 'Saving...';
        const newVault = await encryptVaultWithPassword(newPass.trim(), adminToken);
        const contentBase64 = btoa(JSON.stringify(newVault, null, 2));
        await githubUpsertFile(
          'data/admin-vault.json',
          contentBase64,
          'Update encrypted admin password vault'
        );
        alert('✅ Admin Password updated online!');
      } catch (err) {
        alert('Failed to update password: ' + err.message);
      } finally {
        changePassBtn.textContent = '🔑 Change Password';
      }
    });
  }

  // 4. Direct Video File Upload (.mp4 / .mov / .webm)
  if (videoFileInput) {
    videoFileInput.addEventListener('change', async () => {
      const file = videoFileInput.files && videoFileInput.files[0];
      if (!file) return;

      const fileNameLabel = document.getElementById('selectedFileName');
      const progressWrap = document.getElementById('uploadProgressWrap');
      const statusText = document.getElementById('uploadStatusText');
      const pctText = document.getElementById('uploadPercentText');
      const fillEl = document.getElementById('uploadProgressFill');
      const videoUrlInput = document.getElementById('projVideoUrl');
      const saveBtn = document.getElementById('saveProjectBtn');

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      fileNameLabel.textContent = `${file.name} (${sizeMB} MB)`;

      if (file.size > 25 * 1024 * 1024) {
        alert(
          '⚠️ This video is over 25 MB. For larger videos, please compress to under 25 MB or paste a YouTube / TikTok / Google Drive link.'
        );
        return;
      }

      try {
        progressWrap.classList.remove('hidden');
        saveBtn.disabled = true;
        statusText.textContent = 'Uploading video to cloud...';
        pctText.textContent = '5%';
        fillEl.style.width = '5%';

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const cloudPath = `uploads/${Date.now()}-${safeName}`;
        const base64Data = await fileToBase64(file);

        await githubUpsertFile(
          cloudPath,
          base64Data,
          `Upload video ${safeName}`,
          (pct) => {
            pctText.textContent = `${pct}%`;
            fillEl.style.width = `${pct}%`;
          }
        );

        const publicVideoUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${cloudPath}`;
        videoUrlInput.value = publicVideoUrl;
        statusText.textContent = '✅ Video uploaded! Click "Save & Publish Online" below.';
      } catch (err) {
        statusText.textContent = `❌ Upload error: ${err.message}`;
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // 5. Cancel Edit
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetProjectForm);
  }

  // 6. Save / Publish Project Form
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('editProjectId').value;
      const title = document.getElementById('projTitle').value.trim();
      const category = document.getElementById('projCategory').value;
      const badgeInput = document.getElementById('projBadge').value.trim();
      const videoUrl = document.getElementById('projVideoUrl').value.trim();
      const description = document.getElementById('projDesc').value.trim();
      const tagsRaw = document.getElementById('projTags').value.trim();
      const externalUrl = document.getElementById('projExternalUrl').value.trim();
      const saveBtn = document.getElementById('saveProjectBtn');
      const statusMsg = document.getElementById('adminSaveStatus');

      const defaultBadge =
        category === 'affiliate'
          ? 'Affiliate Campaign'
          : category === 'vibecode'
            ? 'Vibe Coding'
            : 'Video Editing';

      const projectItem = {
        id: editId || `proj-${Date.now()}`,
        title,
        category,
        badge: badgeInput || defaultBadge,
        description,
        tags: tagsRaw
          ? tagsRaw
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [defaultBadge],
        videoUrl,
        externalUrl,
        createdAt: new Date().toISOString()
      };

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = '☁️ Publishing to Live Website...';
        statusMsg.classList.add('hidden');

        if (editId) {
          const idx = allProjects.findIndex((p) => p.id === editId);
          if (idx !== -1) allProjects[idx] = projectItem;
          else allProjects.unshift(projectItem);
        } else {
          // Put newest uploaded video at the very top!
          allProjects.unshift(projectItem);
        }

        await saveProjectsToCloud(`Publish project: ${title}`);
        renderProjectsGrid();
        renderAdminProjectsList();
        resetProjectForm();

        statusMsg.textContent = '✅ Published! Your video/project is now LIVE online for all visitors!';
        statusMsg.classList.remove('hidden');
      } catch (err) {
        alert('Failed to publish online: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '🚀 Save & Publish Online';
      }
    });
  }
}

function resetProjectForm() {
  document.getElementById('editProjectId').value = '';
  document.getElementById('projTitle').value = '';
  document.getElementById('projCategory').value = 'video';
  document.getElementById('projBadge').value = '';
  document.getElementById('projVideoUrl').value = '';
  document.getElementById('projDesc').value = '';
  document.getElementById('projTags').value = '';
  document.getElementById('projExternalUrl').value = '';
  document.getElementById('selectedFileName').textContent = 'No file chosen';
  document.getElementById('uploadProgressWrap').classList.add('hidden');
  document.getElementById('adminFormHeading').textContent = '➕ Upload New Video / Project';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function renderAdminProjectsList() {
  const listEl = document.getElementById('adminProjectsList');
  const countEl = document.getElementById('adminProjectCount');
  if (!listEl) return;

  if (countEl) countEl.textContent = String(allProjects.length);

  listEl.innerHTML = allProjects
    .map(
      (proj, idx) => `
      <div class="admin-item">
        <div class="admin-item-info">
          <h5>${escapeHtml(proj.title)}</h5>
          <div class="admin-item-sub">
            <span>${escapeHtml(proj.badge || proj.category)}</span>
            ${proj.videoUrl ? '<span style="color:#0284c7;font-weight:700;">🎬 Has Video</span>' : '<span>No video attached</span>'}
          </div>
        </div>
        <div class="admin-item-actions">
          ${
            idx > 0
              ? `<button type="button" class="btn-icon-sm" data-move-up="${escapeHtml(proj.id)}" title="Move to Top">⬆️</button>`
              : ''
          }
          <button type="button" class="btn-icon-sm" data-edit-id="${escapeHtml(proj.id)}">✏️ Edit</button>
          <button type="button" class="btn-icon-sm danger" data-delete-id="${escapeHtml(proj.id)}">🗑️</button>
        </div>
      </div>
    `
    )
    .join('');

  // Edit button handler
  listEl.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      const proj = allProjects.find((p) => p.id === id);
      if (!proj) return;

      document.getElementById('editProjectId').value = proj.id;
      document.getElementById('projTitle').value = proj.title || '';
      document.getElementById('projCategory').value = proj.category || 'video';
      document.getElementById('projBadge').value = proj.badge || '';
      document.getElementById('projVideoUrl').value = proj.videoUrl || '';
      document.getElementById('projDesc').value = proj.description || '';
      document.getElementById('projTags').value = (proj.tags || []).join(', ');
      document.getElementById('projExternalUrl').value = proj.externalUrl || '';
      document.getElementById('adminFormHeading').textContent = '✏️ Edit Video / Project';
      document.getElementById('cancelEditBtn').classList.remove('hidden');
      document.getElementById('adminSaveStatus').classList.add('hidden');
    });
  });

  // Move to top handler
  listEl.querySelectorAll('[data-move-up]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-move-up');
      const idx = allProjects.findIndex((p) => p.id === id);
      if (idx > 0) {
        const [item] = allProjects.splice(idx, 1);
        allProjects.unshift(item);
        renderProjectsGrid();
        renderAdminProjectsList();
        await saveProjectsToCloud(`Move project ${item.title} to top`);
      }
    });
  });

  // Delete button handler
  listEl.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      const proj = allProjects.find((p) => p.id === id);
      if (!proj) return;
      if (!confirm(`Delete "${proj.title}" from your live website?`)) return;

      allProjects = allProjects.filter((p) => p.id !== id);
      renderProjectsGrid();
      renderAdminProjectsList();
      await saveProjectsToCloud(`Delete project: ${proj.title}`);
    });
  });
}

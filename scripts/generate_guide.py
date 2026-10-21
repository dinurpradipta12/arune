import os
import subprocess
import base64

def get_base64_image(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as f:
        data = f.read()
    ext = path.split(".")[-1].lower()
    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
    return f"data:{mime};base64,{base64.b64encode(data).decode('utf-8')}"

def build_html():
    img_logo = get_base64_image("public/tutorial-images/logo.png")
    img_home = get_base64_image("public/tutorial-images/home_mockup.jpg")
    img_recent = get_base64_image("public/tutorial-images/home_recent_projects.png")
    img_team_mockup = get_base64_image("public/tutorial-images/team_mockup.jpg")
    img_team_real = get_base64_image("public/tutorial-images/team_workspace_real.png")
    img_team_stack = get_base64_image("public/tutorial-images/team_stacked_cards.png")
    img_editor = get_base64_image("public/tutorial-images/studio_editor_canvas.png")
    img_insta = get_base64_image("public/tutorial-images/instagram_simulator.png")
    img_share = get_base64_image("public/tutorial-images/share_project_modal.png")
    img_brand = get_base64_image("public/tutorial-images/brand_kit_inspector.png")

    html = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Arune Carousel Studio - Panduan Lengkap Pengguna</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {{
    size: A4 portrait;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1E293B;
    background-color: #F8FAFC;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .page {{
    width: 210mm;
    height: 297mm;
    position: relative;
    page-break-after: always;
    overflow: hidden;
    background: #FFFFFF;
    padding: 20mm 20mm 18mm 20mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  /* Page Running Header & Footer */
  .page-header {{
    position: absolute;
    top: 10mm;
    left: 20mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 3mm;
  }}

  .page-footer {{
    position: absolute;
    bottom: 8mm;
    left: 20mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #94A3B8;
    border-top: 1px solid #E2E8F0;
    padding-top: 3mm;
  }}

  .content-area {{
    margin-top: 8mm;
    margin-bottom: 6mm;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }}

  /* Typography */
  h1.chapter-title {{
    font-family: 'Outfit', sans-serif;
    font-size: 20pt;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.02em;
    margin-bottom: 2mm;
    display: flex;
    align-items: center;
    gap: 8px;
  }}

  .chapter-badge {{
    display: inline-block;
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: #EFF6FF;
    color: #2563EB;
    border: 1px solid #BFDBFE;
    padding: 2px 8px;
    border-radius: 6px;
    margin-bottom: 2mm;
  }}

  p.chapter-desc {{
    font-size: 9pt;
    line-height: 1.45;
    color: #475569;
    margin-bottom: 4mm;
  }}

  h2.section-heading {{
    font-size: 11pt;
    font-weight: 700;
    color: #1E293B;
    margin-top: 3mm;
    margin-bottom: 2mm;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .num-pill {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #2563EB;
    color: #FFFFFF;
    font-size: 7.5pt;
    font-weight: 800;
    border-radius: 50%;
  }}

  .num-pill.emerald {{
    background: #059669;
  }}

  .num-pill.amber {{
    background: #D97706;
  }}

  .num-pill.purple {{
    background: #7C3AED;
  }}

  p.text-body {{
    font-size: 8.5pt;
    line-height: 1.5;
    color: #334155;
    margin-bottom: 2.5mm;
  }}

  /* Feature Grid List */
  .feature-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3.5mm;
    margin-bottom: 3.5mm;
  }}

  .feature-box {{
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 3mm 3.5mm;
  }}

  .feature-box h3 {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 1mm;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .feature-box p {{
    font-size: 7.5pt;
    color: #475569;
    line-height: 1.4;
  }}

  /* Screenshot Card */
  .screenshot-container {{
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #CBD5E1;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    margin: 2.5mm 0 3.5mm 0;
    background: #0A1A2F;
  }}

  .screenshot-container img {{
    width: 100%;
    display: block;
    max-height: 75mm;
    object-fit: cover;
  }}

  .screenshot-caption {{
    background: #F1F5F9;
    padding: 2mm 3.5mm;
    font-size: 7pt;
    color: #64748B;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }}

  /* Pro-tip Alert Box */
  .callout {{
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    border-left: 4px solid #16A34A;
    border-radius: 8px;
    padding: 2.5mm 3.5mm;
    margin: 2.5mm 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }}

  .callout.tip {{
    background: #EFF6FF;
    border-color: #BFDBFE;
    border-left-color: #2563EB;
  }}

  .callout.amber {{
    background: #FEFCE8;
    border-color: #FEF08A;
    border-left-color: #CA8A04;
  }}

  .callout-title {{
    font-size: 8pt;
    font-weight: 700;
    color: #0F172A;
  }}

  .callout-text {{
    font-size: 7.5pt;
    color: #334155;
    line-height: 1.4;
    margin-top: 0.5mm;
  }}

  /* Hotkey Table */
  table.hotkey-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin: 2mm 0;
  }}

  table.hotkey-table th {{
    background: #0F172A;
    color: #FFFFFF;
    text-align: left;
    padding: 2mm 3mm;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 7pt;
  }}

  table.hotkey-table td {{
    padding: 2mm 3mm;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
  }}

  table.hotkey-table tr:nth-child(even) td {{
    background: #F8FAFC;
  }}

  .kbd {{
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
    font-weight: 700;
    background: #E2E8F0;
    color: #0F172A;
    padding: 1.5px 5px;
    border-radius: 4px;
    border: 1px solid #CBD5E1;
  }}

  /* Cover Page Styles */
  .page-cover {{
    background: radial-gradient(circle at top right, #1E293B, #0A1A2F 60%, #030712);
    color: #FFFFFF;
    padding: 28mm 25mm 24mm 25mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  .cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}

  .cover-logo {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .cover-logo img {{
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }}

  .cover-logo-text {{
    font-family: 'Outfit', sans-serif;
    font-size: 15pt;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #FFFFFF;
  }}

  .cover-edition {{
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #38BDF8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    padding: 3px 12px;
    border-radius: 100px;
  }}

  .cover-main {{
    margin: 15mm 0;
  }}

  .cover-tagline {{
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #94A3B8;
    margin-bottom: 4mm;
  }}

  .cover-title {{
    font-family: 'Outfit', sans-serif;
    font-size: 32pt;
    line-height: 1.08;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #FFFFFF;
    margin-bottom: 5mm;
  }}

  .cover-title span {{
    background: linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .cover-subtitle {{
    font-size: 11pt;
    line-height: 1.5;
    color: #CBD5E1;
    max-width: 140mm;
  }}

  .cover-preview-card {{
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 5mm;
    backdrop-filter: blur(10px);
    margin-top: 6mm;
    display: flex;
    align-items: center;
    gap: 15px;
  }}

  .cover-preview-card img {{
    width: 65mm;
    height: 40mm;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }}

  .cover-preview-info {{
    flex: 1;
  }}

  .cover-preview-info h4 {{
    font-size: 9.5pt;
    font-weight: 700;
    color: #F8FAFC;
    margin-bottom: 1.5mm;
  }}

  .cover-preview-info p {{
    font-size: 7.5pt;
    line-height: 1.4;
    color: #94A3B8;
  }}

  .cover-meta {{
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 5mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }}

  .cover-meta-item {{
    font-size: 8pt;
    color: #94A3B8;
  }}

  .cover-meta-item strong {{
    display: block;
    font-size: 9pt;
    color: #FFFFFF;
    margin-top: 1mm;
  }}

  /* Back Cover */
  .page-back {{
    background: #0A1A2F;
    color: #FFFFFF;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30mm 25mm;
  }}

  .page-back img.big-logo {{
    width: 64px;
    height: 64px;
    border-radius: 16px;
    margin-bottom: 6mm;
  }}

  .page-back h2 {{
    font-family: 'Outfit', sans-serif;
    font-size: 20pt;
    font-weight: 800;
    margin-bottom: 2mm;
    color: #FFFFFF;
  }}

  .page-back p {{
    font-size: 9.5pt;
    color: #94A3B8;
    max-width: 120mm;
    line-height: 1.5;
    margin-bottom: 8mm;
  }}

  .contact-badges {{
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 10mm;
  }}

  .contact-pill {{
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 3px 12px;
    border-radius: 100px;
    font-size: 8pt;
    color: #E2E8F0;
    font-family: 'JetBrains Mono', monospace;
  }}
</style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- HALAMAN 1: SAMPUL DEPAN (EBOOK COVER)                                 -->
  <!-- ===================================================================== -->
  <div class="page page-cover">
    <div class="cover-top">
      <div class="cover-logo">
        <img src="{img_logo}" alt="Arune Studio Logo">
        <span class="cover-logo-text">ARUNE STUDIO</span>
      </div>
      <span class="cover-edition">EDISI RESMI 2026 • V1.0.2</span>
    </div>

    <div class="cover-main">
      <div class="cover-tagline">MASTER USER MANUAL &amp; CREATOR GUIDEBOOK</div>
      <h1 class="cover-title">PANDUAN LENGKAP<br><span>ARUNE CAROUSEL</span><br>STUDIO</h1>
      <p class="cover-subtitle">
        Buku panduan komprehensif mendesain carousel editorial Instagram, microblog, story vertikal, kolaborasi tim multiplayer, manajemen folder proyek, dan publikasi konten berkualitas majalah.
      </p>

      <div class="cover-preview-card">
        <img src="{img_home}" alt="Studio Dashboard Preview">
        <div class="cover-preview-info">
          <h4>Studio Editorial Modern Tanpa Ribet</h4>
          <p>
            Dirancang khusus untuk kreator, agensi, dan tim konten yang mengutamakan tipografi Swiss, visual clean, layout otomatis, serta sinkronisasi cloud real-time.
          </p>
        </div>
      </div>
    </div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        Kategori Software
        <strong>Creative Editorial Studio</strong>
      </div>
      <div class="cover-meta-item">
        Penulis &amp; Arsitek
        <strong>Dinur Pradipta</strong>
      </div>
      <div class="cover-meta-item">
        Format Ekspor
        <strong>Ultra-HD Retina 3× (ZIP, PNG, Clipboard)</strong>
      </div>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 2: DAFTAR ISI & PENGENALAN                                    -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Arune Carousel Studio — Panduan Pengguna</span>
      <span>Daftar Isi &amp; Pengenalan</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">PENDAHULUAN</span>
      <h1 class="chapter-title">Daftar Isi &amp; Filosofi Desain</h1>
      <p class="chapter-desc">
        Selamat datang di <strong>Arune Carousel Studio</strong>. Aplikasi ini dibangun untuk mengubah cara kreator dan agensi memproduksi konten media sosial bergaya editorial majalah dengan cepat, estetik, dan konsisten.
      </p>

      <h2 class="section-heading" style="margin-top: 1mm; margin-bottom: 2mm;">
        Daftar Bab Panduan
      </h2>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 4mm 5mm; margin-bottom: 4mm;">
        <table style="width: 100%; font-size: 8.5pt; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB; width: 22mm;">BAB 1</td>
            <td style="font-weight: 600; color: #0F172A;">Halaman Utama (Home Dashboard): Format Kanvas, Proyek &amp; Tim</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 3</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 2</td>
            <td style="font-weight: 600; color: #0F172A;">Studio Editor: Tampilan 3 Kolom, Slide Stage &amp; Inspektor Desain</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 4</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 3</td>
            <td style="font-weight: 600; color: #0F172A;">Top Header Bar, Multi-Document Tabs &amp; Smart Export HD</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 5</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 4</td>
            <td style="font-weight: 600; color: #0F172A;">Manajemen Kumpulan Folder Proyek: Pengelompokan Desain Terstruktur</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 6</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 5</td>
            <td style="font-weight: 600; color: #0F172A;">Ruang Kerja Tim (Team Workspace): Kolaborasi Cloud &amp; Brand Kit</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 7</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0; height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 6</td>
            <td style="font-weight: 600; color: #0F172A;">Fitur Pendukung: Instagram Simulator, Font Komputer &amp; Backup JSON</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 8</td>
          </tr>
          <tr style="height: 7mm;">
            <td style="font-weight: 700; color: #2563EB;">BAB 7</td>
            <td style="font-weight: 600; color: #0F172A;">Daftar Pintasan Keyboard (Hotkeys) &amp; Formula Carousel Engagement Tinggi</td>
            <td style="text-align: right; color: #64748B; font-weight: 700;">Halaman 9</td>
          </tr>
        </table>
      </div>

      <h2 class="section-heading">Tiga Pilar Utama Arune Studio</h2>
      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill">1</span> Format Kanvas Khusus Media Sosial</h3>
          <p>
            Mendukung 3 format rasio terstandar industri: <strong>4:5 Portrait Feed (1080×1350 px)</strong> untuk jangkauan feed maksimal, <strong>9:16 Vertical Story (1080×1920 px)</strong>, dan <strong>1:1 Square (1080×1080 px)</strong>.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">2</span> Offline-First &amp; Cloud Hybrid</h3>
          <p>
            Bekerja tanpa henti meski koneksi internet terputus berkat penyimpanan lokal berkecepatan tinggi, dan otomatis tersinkronisasi ke <strong>Supabase Cloud</strong> saat online.
          </p>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">💡 Tip Membaca Ebook Panduan</div>
          <div class="callout-text">
            Buku ini disusun secara visual. Setiap halaman memuat tangkapan layar antarmuka asli beserta penomoran komponen agar Anda dapat mempraktikkannya langsung di aplikasi.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Edisi Resmi 2026</span>
      <span>Halaman 2 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 3: BAB 1 - HOME DASHBOARD                                     -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 1 — Halaman Utama (Home Dashboard)</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 1</span>
      <h1 class="chapter-title">Navigasi Halaman Utama (Home)</h1>
      <p class="chapter-desc">
        Halaman Home berfungsi sebagai pusat komando tempat Anda memilih rasio kanvas baru, mengelola arsip proyek tersimpan, membuka folder proyek, dan memilih tim kerja.
      </p>

      <div class="screenshot-container">
        <img src="{img_recent}" alt="Bagian Proyek Terakhir dan Format Kanvas">
        <div class="screenshot-caption">
          <span>Antarmuka Home Dashboard: Format Cepat, Proyek Terakhir, dan Tombol Folder</span>
          <span style="font-family: monospace;">TemplateGalleryPage.tsx</span>
        </div>
      </div>

      <h2 class="section-heading">Bedah Bagian &amp; Tombol Penting</h2>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill">A</span> Mulai Desain Baru (3 Format Kartu)</h3>
          <p>
            Klik salah satu dari tiga kartu rasio kanvas untuk langsung membuka editor kanvas kosong beresolusi tajam sesuai target postingan.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill amber">B</span> Tombol [📁 Folder Proyek]</h3>
          <p>
            Terletak tepat di sebelah kiri switcher Grid View. Klik tombol ini untuk membuka halaman khusus <strong>Kumpulan Folder Proyek</strong>.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">C</span> Kartu Aksi Proyek Terakhir</h3>
          <p>
            Setiap kartu memiliki tombol: <strong>Buka</strong> (masuk ke editor), <strong>📁 Folder</strong> (masukkan/pindahkan ke folder), <strong>📋 Duplikat</strong>, dan <strong>🗑️ Hapus</strong>.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill purple">D</span> Deck Kartu Tim Bertumpuk</h3>
          <p>
            Di panel kanan, daftar tim tersusun secara vertikal bertumpuk (hingga 5 tim). Sorot kursor (hover) untuk memunculkan kartu tim langsung ke atas.
          </p>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">💡 Label &amp; Tag Folder Otomatis</div>
          <div class="callout-text">
            Bila suatu proyek telah dimasukkan ke dalam folder tertentu, kartu proyek di Home akan otomatis memunculkan badge warna folder (misal: <code>📁 Bisnis & Promosi Klien</code>).
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 1: Halaman Utama</span>
      <span>Halaman 3 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 4: BAB 2 - STUDIO EDITOR (3 KOLOM)                            -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 2 — Studio Editor (3 Kolom)</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 2</span>
      <h1 class="chapter-title">Studio Editor: Tampilan 3 Kolom</h1>
      <p class="chapter-desc">
        Ruang kerja editor mengusung arsitektur 3 kolom profesional (mirip Canva dan Figma) yang memisahkan konten, kanvas rendering, dan kontrol gaya tipografi.
      </p>

      <div class="screenshot-container">
        <img src="{img_editor}" alt="Studio Editor 3 Kolom">
        <div class="screenshot-caption">
          <span>Arsitektur Editor: Left Sidebar (Konten), Center Stage (Kanvas), Right Inspector (Style)</span>
          <span style="font-family: monospace;">EditorLayout.tsx</span>
        </div>
      </div>

      <h2 class="section-heading">Fungsi Masing-Masing Kolom</h2>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill">1</span> Kolom Kiri (Left Sidebar)</h3>
          <p>
            <strong>• Script Parser:</strong> Ketik atau tempel naskah mentah, sistem otomatis membedah jadi slide terstruktur.<br>
            <strong>• Slide Manager:</strong> Tambah slide baru, atur tata urutan drag-and-drop, atau duplikat slide.<br>
            <strong>• Elements:</strong> Sisipkan gambar, kutipan, headline, dan shapes.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">2</span> Area Tengah (Center Workspace)</h3>
          <p>
            <strong>• Slide Stage:</strong> Pratinjau WYSIWYG presisi piksel sesuai aspek rasio yang dipilih.<br>
            <strong>• Zoom Slider:</strong> Zoom in/out mulai dari 50% hingga 150% untuk inspeksi detail tipografi.<br>
            <strong>• Bottom Status Bar:</strong> Menampilkan slide aktif, rasio, status autosave, dan tombol preview.
          </p>
        </div>
      </div>

      <div class="feature-box" style="margin-bottom: 3.5mm;">
        <h3><span class="num-pill purple">3</span> Kolom Kanan (Right Inspector &amp; Style)</h3>
        <p>
          Tempat mengontrol estetika visual carousel secara menyeluruh:
          <strong>Tema Warna &amp; Palet</strong> (Kinfolk Linen, Swiss High Fashion, Minimalist Slate),
          <strong>Typography Pairing</strong> (Plus Jakarta Sans, Playfair, Inter), serta
          <strong>Branding Otomatis</strong> (Atur handle <code>@username</code>, nama publikasi, dan nomor halaman otomatis).
        </p>
      </div>

      <div class="callout">
        <div>
          <div class="callout-title">✨ Smart Script Parser Otomatis</div>
          <div class="callout-text">
            Cukup pisahkan naskah Anda dengan tanda garis pembatas (<code>---</code>) di tab Konten, editor akan langsung membuat slide baru dan mengatur hierarki judul secara instan.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 2: Studio Editor</span>
      <span>Halaman 4 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 5: BAB 3 - TOP HEADER & SMART EXPORT HD                       -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 3 — Top Header &amp; Smart Export HD</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 3</span>
      <h1 class="chapter-title">Top Header Bar &amp; Smart Export</h1>
      <p class="chapter-desc">
        Header atas editor memuat navigasi dokumen multi-tab, kontrol undo/redo, tombol folder proyek aktif, hingga sistem ekspor berkecepatan tinggi beresolusi Retina 3×.
      </p>

      <div class="feature-grid" style="margin-top: 1mm;">
        <div class="feature-box">
          <h3><span class="num-pill">1</span> Multi-Document Tabs (+ Tab)</h3>
          <p>
            Membuka dan mengerjakan beberapa file carousel secara bersamaan tanpa perlu menutup proyek yang sedang aktif. Mirip sistem tab di Photoshop dan browser.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill amber">2</span> Tombol [📁 Folder] di Header</h3>
          <p>
            Memungkinkan Anda memasukkan atau memindahkan proyek yang sedang dibuka ke dalam folder kategori kerja secara instan tanpa harus kembali ke Home.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">3</span> Tombol Dark / Light Mode</h3>
          <p>
            Beralih suasana kerja dari Deep Midnight Slate (#0A1A2F) ke Clean Nordic White (#F1F5F4) dengan satu klik tombol matahari/bulan.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill purple">4</span> Menu Titik Tiga (...)</h3>
          <p>
            Mengakses pengaturan Global Branding kustom, Import/Export file format JSON untuk backup data, dan kustomisasi pintasan keyboard (Hotkeys).
          </p>
        </div>
      </div>

      <h2 class="section-heading" style="margin-top: 2mm;">
        3 Pilihan Smart Export Engine
      </h2>

      <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 12px; padding: 4mm 5mm; margin-bottom: 3.5mm;">
        <div style="display: flex; gap: 4mm; margin-bottom: 3mm;">
          <div style="width: 24px; height: 24px; background: #2563EB; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 800; font-size: 9pt; shrink: 0;">ZIP</div>
          <div>
            <strong style="font-size: 8.5pt; color: #0F172A;">1. Download Paket Lengkap .ZIP (Ultra-HD Retina 3×)</strong>
            <p style="font-size: 7.5pt; color: #475569; margin-top: 0.5mm; line-height: 1.4;">
              Mengekspor seluruh slide carousel secara sekuensial (01.png, 02.png, dst.) ke dalam arsip ZIP berkualitas tinggi 3× piksel (misal 3240×4050 px) yang sangat tajam di layar smartphone.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 4mm; margin-bottom: 3mm;">
          <div style="width: 24px; height: 24px; background: #059669; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 800; font-size: 8pt; shrink: 0;">COPY</div>
          <div>
            <strong style="font-size: 8.5pt; color: #0F172A;">2. Salin Slide Ini ke Clipboard (Quick Paste)</strong>
            <p style="font-size: 7.5pt; color: #475569; margin-top: 0.5mm; line-height: 1.4;">
              Merender slide aktif langsung ke memori clipboard sistem operasi. Sangat praktis untuk langsung di-paste (Cmd/Ctrl+V) ke WhatsApp Web, Slack, Telegram, atau Notion.
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 4mm;">
          <div style="width: 24px; height: 24px; background: #9333EA; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 800; font-size: 8pt; shrink: 0;">PNG</div>
          <div>
            <strong style="font-size: 8.5pt; color: #0F172A;">3. Download Slide Ini Saja (Single Slide PNG)</strong>
            <p style="font-size: 7.5pt; color: #475569; margin-top: 0.5mm; line-height: 1.4;">
              Mendownload satu slide cover atau slide tertentu secara mandiri dalam format file PNG tanpa perlu mengekspor seluruh slide lainnya.
            </p>
          </div>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">💡 Kenapa Resolusi Retina 3× Penting?</div>
          <div class="callout-text">
            Instagram melakukan kompresi ketat saat pengguna mengunggah gambar. Dengan resolusi 3× (3240×4050 px), teks kecil pada carousel Anda akan tetap terbaca jernih dan bebas blur di layar HP.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 3: Top Header Bar</span>
      <span>Halaman 5 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 6: BAB 4 - MANAJEMEN FOLDER PROYEK                            -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 4 — Manajemen Folder Proyek</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 4</span>
      <h1 class="chapter-title">Manajemen Kumpulan Folder Proyek</h1>
      <p class="chapter-desc">
        Fitur Folder Proyek memungkinkan Anda mengelompokkan arsip desain carousel berdasarkan nama klien, topik industri, atau jadwal kampanye bulanan agar tidak bercampur.
      </p>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill amber">1</span> Pintu Masuk Halaman Folder</h3>
          <p>
            Di halaman Home pada bagian <strong>Proyek Terakhir</strong>, klik tombol <strong>[📁 Folder Proyek]</strong> di sebelah tombol switcher Grid View untuk membuka halaman manajemen folder.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill">2</span> Membuat Folder Baru</h3>
          <p>
            Klik tombol <strong>+ Buat Folder Baru</strong>, lalu masukkan nama folder, deskripsi singkat, dan pilih satu dari 8 palet warna folder (Biru, Amber, Hijau, Ungu, Merah, Indigo, Cyan, Oranye).
          </p>
        </div>
      </div>

      <h2 class="section-heading" style="margin-top: 1mm;">
        Dua Tampilan Utama di Halaman Folder
      </h2>

      <div class="feature-box" style="margin-bottom: 3.5mm;">
        <h3>📁 Tampilan Semua Folder (Overview Grid)</h3>
        <p>
          Menampilkan seluruh kartu folder yang telah Anda buat beserta badge jumlah proyek yang tersimpan di dalamnya, tanggal update terakhir, serta ringkasan statistik (Total Folder, Total Proyek, dan Proyek yang belum dimasukkan ke folder). Anda juga dapat mengedit nama/warna folder atau menghapus folder kapan saja.
        </p>
      </div>

      <div class="feature-box" style="margin-bottom: 3.5mm;">
        <h3>📂 Tampilan Isi Folder (Detail View)</h3>
        <p>
          Klik salah satu kartu folder untuk masuk ke dalamnya. Di sini Anda dapat:
          <br>• Klik tombol <strong>+ Masukkan Proyek</strong> untuk membuka pemilih proyek bercentang (checkbox).
          <br>• Beralih tampilan proyek antara mode Grid dan List view.
          <br>• Membuka proyek langsung ke editor, membuat duplikat, atau mengeluarkan proyek dari folder.
        </p>
      </div>

      <h2 class="section-heading" style="margin-top: 1mm;">
        Aksi Cepat "Add to Folder" dari Berbagai Sudut
      </h2>
      <p class="text-body">
        Anda tidak harus masuk ke halaman folder terlebih dahulu untuk mengelompokkan proyek:
      </p>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill emerald">A</span> Dari Kartu Proyek di Home</h3>
          <p>
            Setiap kartu di Home memiliki tombol ikon folder <code>[📁]</code> di samping tombol Duplikat. Klik untuk membuka modal centang folder.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill purple">B</span> Dari Header Top Bar Editor</h3>
          <p>
            Saat sedang mengedit kanvas di Editor, klik tombol <code>[📁 Pindahkan ke Folder]</code> di samping judul proyek untuk mengatur folder proyek.
          </p>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">🔒 Menghapus Folder Tidak Menghapus Proyek</div>
          <div class="callout-text">
            Jika Anda menghapus suatu folder, proyek-proyek di dalamnya tidak akan hilang. Proyek tersebut hanya akan dikeluarkan dari folder dan tetap aman di Proyek Terakhir Anda.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 4: Folder Proyek</span>
      <span>Halaman 6 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 7: BAB 5 - RUANG KERJA TIM (TEAM WORKSPACE)                   -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 5 — Ruang Kerja Tim (Team Workspace)</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 5</span>
      <h1 class="chapter-title">Ruang Kerja Tim &amp; Kolaborasi Cloud</h1>
      <p class="chapter-desc">
        Fitur Team Workspace memungkinkan kolaborasi multi-user secara real-time, berbagi aset Brand Kit seragam, dan arsip proyek bersama melalui sinkronisasi Supabase Cloud.
      </p>

      <div class="screenshot-container">
        <img src="{img_team_real}" alt="Antarmuka Team Workspace">
        <div class="screenshot-caption">
          <span>Dashboard Ruang Kerja Tim: Proyek Tim, Brand Kit Resmi, dan Daftar Anggota</span>
          <span style="font-family: monospace;">TeamWorkspacePage.tsx</span>
        </div>
      </div>

      <h2 class="section-heading">Fitur Kunci Ruang Kerja Tim</h2>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill">1</span> Multi-Team Switcher &amp; Edit Tim</h3>
          <p>
            Beralih antar tim klien dengan dropdown tim. Anda dapat mengedit nama tim, mengganti warna avatar swatch, dan <strong>mengunggah foto/logo tim</strong> ke Supabase Storage.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">2</span> Pilih Proyek untuk Dibagikan</h3>
          <p>
            Ketika membagikan proyek ke tim, muncul modal interaktif pemilih proyek agar hanya proyek yang Anda setujui yang masuk ke folder tim, bukan seluruh proyek privat Anda.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill purple">3</span> Brand Kit Resmi Tim</h3>
          <p>
            Atur palet warna resmi perusahaan, font heading, font body, handle media sosial, dan catatan kaki yang otomatis diterapkan pada setiap proyek tim baru.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill amber">4</span> Tingkatan Role Anggota Tim</h3>
          <p>
            <strong>Owner:</strong> Hak penuh kelola tim dan proyek.<br>
            <strong>Editor:</strong> Dapat membuat dan mengedit slide proyek.<br>
            <strong>Viewer:</strong> Hanya memiliki akses melihat dan mengekspor slide.
          </p>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">🔄 Sinkronisasi Real-Time WebSocket</div>
          <div class="callout-text">
            Saat rekan tim Anda memperbarui slide atau menambahkan anggota baru, perubahan tersebut otomatis tampil di layar Anda tanpa perlu refresh browser secara manual.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 5: Ruang Kerja Tim</span>
      <span>Halaman 7 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 8: BAB 6 - FITUR PENDUKUNG LANJUTAN                            -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 6 — Fitur Pendukung Lanjutan</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 6</span>
      <h1 class="chapter-title">Fitur Pendukung &amp; Utility Ekstra</h1>
      <p class="chapter-desc">
        Arune Carousel Studio dilengkapi berbagai tool pendukung cerdas yang memudahkan validasi visual sebelum konten benar-benar diunggah ke media sosial.
      </p>

      <div class="screenshot-container">
        <img src="{img_insta}" alt="Instagram Swipe Simulator">
        <div class="screenshot-caption">
          <span>Instagram Swipe Simulator: Menguji seamless transition dan alur geser feed</span>
          <span style="font-family: monospace;">InstagramSwipeModal.tsx</span>
        </div>
      </div>

      <div class="feature-grid">
        <div class="feature-box">
          <h3><span class="num-pill">1</span> Instagram Swipe Simulator</h3>
          <p>
            Mensimulasikan tampilan feed Instagram asli langsung di dalam aplikasi. Anda dapat menggeser (swipe) slide ke kiri dan ke kanan untuk memastikan elemen yang menyambung antar-slide (seamless carousel) tersambung sempurna tanpa celah.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill emerald">2</span> Local Computer Fonts Scanner</h3>
          <p>
            Aplikasi otomatis mendeteksi font-font yang terpasang di komputer Anda (Mac / Windows). Anda dapat langsung menggunakan font lokal komersial tanpa perlu mengunggah file OTF/TTF secara manual.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill purple">3</span> Backup &amp; Restore Format JSON</h3>
          <p>
            Ekspor seluruh struktur teks, posisi elemen, dan palet warna ke dalam satu file <code>.json</code> ringan. File ini dapat dibagikan ke rekan kerja atau di-import kembali kapan pun Anda inginkan.
          </p>
        </div>
        <div class="feature-box">
          <h3><span class="num-pill amber">4</span> Version History &amp; Snapshot</h3>
          <p>
            Merekam linimasa perubahan proyek tim. Jika terjadi kesalahan desain, Anda dapat meninjau snapshot sebelumnya dan mengembalikan (restore) proyek ke versi tersebut.
          </p>
        </div>
      </div>

      <div class="callout tip">
        <div>
          <div class="callout-title">📱 Format Desktop App Standalone</div>
          <div class="callout-text">
            Selain via browser web, Arune Studio juga tersedia sebagai aplikasi desktop mandiri (macOS DMG / Windows EXE) dengan performa render lebih cepat dan akses offline penuh.
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 6: Fitur Pendukung</span>
      <span>Halaman 8 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 9: BAB 7 - HOTKEYS & FORMULA CAROUSEL                         -->
  <!-- ===================================================================== -->
  <div class="page">
    <div class="page-header">
      <span>Bab 7 — Hotkeys &amp; Formula Carousel</span>
      <span>Arune Carousel Studio</span>
    </div>

    <div class="content-area">
      <span class="chapter-badge">BAB 7</span>
      <h1 class="chapter-title">Pintasan Keyboard &amp; Formula Konten</h1>
      <p class="chapter-desc">
        Kuasai pintasan keyboard untuk mendesain 3× lebih cepat, dan gunakan formula struktur slide editorial yang terbukti menghasilkan engagement dan share tinggi.
      </p>

      <h2 class="section-heading" style="margin-top: 1mm;">
        Tabel Pintasan Keyboard (Hotkeys)
      </h2>

      <table class="hotkey-table">
        <thead>
          <tr>
            <th style="width: 32mm;">Pintasan</th>
            <th style="width: 50mm;">Aksi</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + Z</span></td>
            <td>Undo</td>
            <td>Membatalkan perubahan terakhir pada kanvas atau teks.</td>
          </tr>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + Shift + Z</span></td>
            <td>Redo</td>
            <td>Mengulangi kembali perubahan yang dibatalkan.</td>
          </tr>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + S</span></td>
            <td>Simpan Proyek</td>
            <td>Menyimpan proyek aktif ke penyimpanan vault studio.</td>
          </tr>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + E</span></td>
            <td>Buka Menu Ekspor</td>
            <td>Membuka flyout Smart Export HD (ZIP / PNG / Clipboard).</td>
          </tr>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + T</span></td>
            <td>Buka Tab Baru</td>
            <td>Membuka kanvas dokumen baru di multi-tab editor.</td>
          </tr>
          <tr>
            <td><span class="kbd">Cmd/Ctrl + D</span></td>
            <td>Duplikat Elemen</td>
            <td>Menduplikat elemen teks atau gambar yang sedang dipilih.</td>
          </tr>
          <tr>
            <td><span class="kbd">Delete / Backspace</span></td>
            <td>Hapus Elemen</td>
            <td>Menghapus elemen yang sedang terseleksi di slide stage.</td>
          </tr>
          <tr>
            <td><span class="kbd">Panah Kiri / Kanan</span></td>
            <td>Navigasi Slide</td>
            <td>Beralih ke slide sebelum / sesudahnya di editor.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="section-heading" style="margin-top: 3mm;">
        Formula 6 Slide Carousel Editorial Berengagement Tinggi
      </h2>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 3.5mm 4mm; font-size: 7.5pt; line-height: 1.45; color: #334155;">
        <p><strong>• Slide 1 (The Hook Cover):</strong> Judul bold yang memicu rasa ingin tahu, kontras visual tinggi, dan subtitle yang menjanjikan solusi.</p>
        <p style="margin-top: 1.5mm;"><strong>• Slide 2 (The Problem / Context):</strong> Menguraikan masalah umum yang dihadapi audiens agar mereka merasa terhubung.</p>
        <p style="margin-top: 1.5mm;"><strong>• Slide 3-4 (The Value / Core Steps):</strong> Poin inti dan wawasan step-by-step dengan tipografi bersih dan whitespace lega.</p>
        <p style="margin-top: 1.5mm;"><strong>• Slide 5 (The Summary / Key Takeaway):</strong> Rangkuman singkat atau kutipan inspiratif yang layak di-screenshot audiens.</p>
        <p style="margin-top: 1.5mm;"><strong>• Slide 6 (The Call-To-Action):</strong> Instruksi jelas: <em>"Simpan postingan ini untuk nanti"</em> atau ajakan diskusi di kolom komentar.</p>
      </div>

      <div class="callout tip" style="margin-top: 3mm;">
        <div>
          <div class="callout-title">💡 Kustomisasi Hotkey</div>
          <div class="callout-text">
            Anda dapat mengubah kombinasi tombol pintas di menu <strong>Pengaturan Studio (Cmd+,)</strong> sesuai kebiasaan software favorit Anda (Figma, Photoshop, atau Canva).
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Bab 7: Hotkeys &amp; Formula</span>
      <span>Halaman 9 dari 10</span>
    </div>
  </div>

  <!-- ===================================================================== -->
  <!-- HALAMAN 10: SAMPUL BELAKANG (BACK COVER)                              -->
  <!-- ===================================================================== -->
  <div class="page page-back">
    <img src="{img_logo}" alt="Arune Studio Logo" class="big-logo">
    <h2>ARUNE CAROUSEL STUDIO</h2>
    <p>
      Membantu kreator, desainer, dan pemasar konten di seluruh dunia menghasilkan visual carousel berkualitas tinggi dengan efisiensi maksimal.
    </p>

    <div class="contact-badges">
      <span class="contact-pill">Website: arune.studio</span>
      <span class="contact-pill">GitHub: dinurpradipta12/arune</span>
      <span class="contact-pill">Instagram: @dinurpradiptaa</span>
      <span class="contact-pill">Tech Stack: React 19 • Vite • Tailwind • Supabase</span>
    </div>

    <div style="font-size: 7.5pt; color: #64748B; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 6mm; max-width: 100mm;">
      Hak Cipta &copy; 2026 Arune Creative Studio. Seluruh hak cipta dilindungi undang-undang. Dokumen panduan ini disusun untuk pengguna resmi Arune Carousel Studio.
    </div>
  </div>

</body>
</html>"""

    with open("public/user_guide.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("public/user_guide.html created successfully.")

if __name__ == "__main__":
    build_html()

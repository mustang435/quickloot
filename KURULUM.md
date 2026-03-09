# 🚀 QuickLoot.net Kurulum Rehberi

## Adım 1: MongoDB Atlas Hesabı Oluştur (Ücretsiz)

1. **Şu linke git:** https://www.mongodb.com/cloud/atlas/register
2. **"Try Free" butonuna tıkla**
3. Google hesabınla giriş yap (en kolay yol)
4. **"Build a Database" tıkla**
5. **"M0 FREE" seçeneğini seç** (ücretsiz)
6. Bölge olarak **"AWS - us-east-1"** veya en yakın bölgeyi seç
7. **"Create"** tıkla

### Veritabanı Bağlantı Linki Alma:
1. Sol menüden **"Database"** tıkla
2. **"Connect"** butonuna tıkla
3. **"Drivers"** seç
4. Gelen linki kopyala, şuna benzer:
   ```
   mongodb+srv://kullanici:sifre@cluster0.xxxxx.mongodb.net/quickloot
   ```
5. **Bu linki bir yere not et!**

---

## Adım 2: GitHub'dan Vercel'e Deploy Et

1. **GitHub'a giriş yap**
2. Bu repoyu kendi hesabına **Fork** et
3. **Şu linke git:** https://vercel.com/new
4. **"Import Git Repository"** tıkla
5. Fork ettiğin repoyu seç
6. **"Import"** tıkla

### Environment Variables Ekle:
Vercel'de **"Environment Variables"** bölümüne şunları ekle:

| İsim | Değer |
|------|-------|
| `MONGO_URL` | MongoDB Atlas'tan aldığın link |
| `DB_NAME` | `quickloot` |
| `JWT_SECRET` | Rastgele uzun bir şifre (en az 32 karakter) |
| `ADMIN_PASSWORD_HASH_B64` | `JDJiJDEyJG02WDBXRmp1ZG5MWHBwMXAzV0ZweE9TSm4yL2lxLjlGS0hNT25IdzRIY2V3bTk4MjFVS3Nx` |
| `ADMIN_SESSION_HOURS` | `24` |
| `CRON_SECRET` | Rastgele bir şifre (güvenlik için) |

> 💡 **JWT_SECRET örneği:** `benim-cok-gizli-anahtarim-123456789-quickloot`
> 
> 🔐 **ADMIN_PASSWORD_HASH_B64:** Bu değer `quickloot_strong_password_123!` şifresinin Base64 encoded hash'idir.

7. **"Deploy"** butonuna tıkla
8. 2-3 dakika bekle...
9. 🎉 **Site yayında!**

---

## Adım 3: Admin Paneline Giriş

1. Site adresine `/admin/login` ekle
   - Örnek: `https://quickloot.vercel.app/admin/login`
2. **Şifre:** `quickloot_strong_password_123!`
3. Giriş yap!

> ⚠️ **ÖNEMLİ:** Bu şifreyi değiştirmek için `/app/lib/auth.js` dosyasındaki hash'i güncelle.

---

## Adım 4: Ürün ve Fiyat Ekleme

### Admin Panelinde:

1. **"Products" sekmesine git**
2. **"+ Add Product"** tıkla
3. Ürün bilgilerini gir:
   - Name: PlayStation 5 Digital Edition
   - Brand: Sony
   - Category: Gaming
4. **"Save"** tıkla

5. Ürün listesinde **"🔗 Links"** butonuna tıkla
6. Mağaza linklerini ekle:
   - Store: Amazon.ca
   - URL: Ürünün Amazon linki
   - Price: 549.99 (CAD)
7. **"+ Add Link"** tıkla

8. Diğer mağazalar için tekrarla (Walmart, EB Games, vb.)

---

## Otomatik Fiyat Güncelleme (Cron Job)

Vercel Cron Jobs **her 3 saatte bir** otomatik çalışır:
- Tüm ürün linklerini kontrol eder
- Fiyatları günceller
- En ucuz fiyatı işaretler

> 📝 **Not:** Vercel Pro hesabında Cron Jobs aktif olur. Ücretsiz hesapta manuel tetikleme gerekebilir.

### Manuel Tetikleme:
Admin panelinde **"Scraping"** sekmesine git ve **"Scrape All Now"** tıkla.

---

## 🔧 Sorun Giderme

### "MongoDB connection failed" hatası?
- MongoDB Atlas'ta **Network Access** > **Add IP Address** > **Allow Access from Anywhere** (0.0.0.0/0)

### Admin girişi çalışmıyor?
- Environment Variables'ta `JWT_SECRET` doğru mu kontrol et
- Vercel'i yeniden deploy et

### Fiyatlar güncellenmiyor?
- Büyük mağazalar (Amazon, Walmart) bot koruması kullanır
- Manuel fiyat girişi önerilir

---

## 📱 Destek

Sorun yaşarsan GitHub Issues'a yaz!

---

**İyi satışlar! 🛒**

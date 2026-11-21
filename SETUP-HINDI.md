# HOMI — पूर्ण वर्किंग प्रोजेक्ट सेटअप गाइड (Complete Setup Guide)

HOMI ऑन-डिमांड घरेलू सेवा प्लेटफ़ॉर्म का आधुनिक आर्किटेक्चर:
1. **Backend**: Go (Golang 1.24) + Gin Framework + GORM ORM (Port: 4000)
2. **Database**: PostgreSQL / Supabase PostgreSQL + Supabase Storage
3. **Frontend 1 (Customer App)**: Next.js (Port: 3000)
4. **Frontend 2 (Admin Panel)**: Next.js (Port: 3001)

> **नोट**: इस आर्किटेक्चर में वर्कर के लिए कोई अलग लॉगिन या वर्कर डैशबोर्ड नहीं है। वर्कर केवल पब्लिक "Become a Worker" फॉर्म से आवेदन करते हैं, और एडमिन व्हाट्सएप ग्रुप लिंक और मैनुअल कोटेशन के जरिए काम संभालते हैं।

---

## 1. सिस्टम आवश्यकताएं (Requirements)

- **Go**: 1.22 या 1.24+
- **Node.js**: 20 या 22 LTS
- **PostgreSQL**: 15 या 16 (लोकल या Supabase Cloud)
- **Python 3**: (सत्यापन टेस्ट स्क्रिप्ट्स के लिए)

---

## 2. त्वरित शुरुआत (Quick Start - 3 कमांड्स)

### स्टेप 1: डेटाबेस और एनवायरनमेंट सेटअप
1. PostgreSQL में `homi` नाम का डेटाबेस बनाएं।
2. रूट पर `.env.example` की कॉपी `.env` नाम से बनाएं और अपने डेटाबेस क्रेडेंशियल्स डालें:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/homi
   PORT=4000
   JWT_SECRET=homi-secret-jwt-key-32-chars-long-minimum-secure
   WHATSAPP_GROUP_INVITE_URL=https://chat.whatsapp.com/YOUR_GROUP_LINK
   ```

### स्टेप 2: बैकएंड सर्वर शुरू करें (Port 4000)
```bash
cd backend
go run cmd/api/main.go
# या बिल्ड करके चलाएं:
# go build -o bin/api cmd/api/main.go && ./bin/api
```
बैकएंड http://localhost:4000 पर सक्रिय हो जाएगा।

### स्टेप 3: फ्रंटएंड ऍप्लिकेशन्स शुरू करें

**ग्राहक ऍप (Customer App - Port 3000):**
```bash
npm --prefix frontend/customer-app run dev
```
ब्राउज़र में खोलें: http://localhost:3000

**एडमिन पैनल (Admin Panel - Port 3001):**
```bash
npm --prefix frontend/admin-panel run dev
```
ब्राउज़र में खोलें: http://localhost:3001

---

## 3. डेमो क्रेडेंशियल्स (Demo Login)

- **Admin Console**: `admin@homi.demo` / `demo1234` (URL: http://localhost:3001/login)
- **Customer Account**: `customer@homi.demo` / `demo1234` या सीधे नया रजिस्ट्रेशन करें।

---

## 4. मुख्य व्यावसायिक वर्कफ़्लो (Business Workflows)

1. **ग्राहक सेवा अनुरोध (Customer Service Request)**:
   - ग्राहक http://localhost:3000/book पर समस्या लिखता है, 3 फ़ोटो तक अपलोड करता है, और समय चुनता है।
   - अनुरोध तुरंत `NEW` स्थिति में एडमिन पैनल में आ जाता है।

2. **व्हाट्सएप शेयरिंग (WhatsApp Group Job Post)**:
   - एडमिन रिक्वेस्ट विवरण खोलकर **"Send to WhatsApp Group"** पर क्लिक करता है।
   - ग्राहक की गोपनीयता सुरक्षित रखते हुए (मकान नंबर और फोन छुपाकर) जॉब मैसेज जनरेट होता है।
   - एडमिन मैसेज कॉपी करके व्हाट्सएप ग्रुप में पेस्ट करता है और **"Mark as Shared"** दबाता है।
   - स्थिति `SHARED_WITH_WORKERS` हो जाती है।

3. **वर्कर कोटेशन और चयन (Quotes & Selection)**:
   - व्हाट्सएप से आए वर्करों के रेट एडमिन फॉर्म में दर्ज करता है।
   - पसंदीदा कारीगर चुनने पर स्थिति `WORKER_SELECTED` हो जाती है।

4. **ग्राहक कोटेशन अनुमोदन (Customer Quote Approval)**:
   - एडमिन फाइनल कोटेशन ग्राहक को भेजता है (`CUSTOMER_APPROVAL_PENDING`)।
   - ग्राहक अपने डैशबोर्ड में कोटेशन स्वीकार (`accept`) या अस्वीकार (`decline`) करता है।
   - **नियम**: जब तक ग्राहक अप्रूव न करे (`CUSTOMER_CONFIRMED`), तब तक वर्कर असाइनमेंट ब्लॉक रहता है।

5. **वर्कर असाइनमेंट (Confirm Worker Assignment)**:
   - ग्राहक की मंज़ूरी के बाद एडमिन कन्फर्म करता है, और स्थिति `ASSIGNED` हो जाती है।

---

## 5. परीक्षण और सत्यापन (Automated Verification)

सभी 15 व्यावसायिक परिदृश्यों (Scenarios) का ऑटोमेटेड सत्यापन चलाने के लिए:

```bash
# Go यूनिट टेस्ट
cd backend && go test -v ./...

# 15-परिदृश्य एंड-टू-एंड टेस्ट
python3 scripts/verify-all-scenarios.py
```

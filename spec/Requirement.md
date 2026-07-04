# 📄 Requirement Specification — From Home Sandwich

> **Goal**: กำหนดรายละเอียดความต้องการของระบบ (Functional Requirements) สำหรับการพัฒนาใหม่  
> **Target Users**: AI Agent / Developer (สำหรับการเขียน Code และออกแบบ Database)  
> **Version**: 1.0 (2026-07-03)

---

## 1. Master Data Management (สาขาหลัก)
พื้นที่จัดการข้อมูลพื้นฐานที่ใช้ร่วมกันทุกช่องทางการขาย

### 1.1 หมวดหมู่สินค้า (Categories)
- ระบบต้องรองรับการแยกประเภทสินค้าชัดเจน (เช่น `Sandwich`, `Drink`)
- **Fields:** `id`, `name`, `is_active`
- **Action:** CRUD ได้ (เพิ่ม/แก้ไข/ลบ หมวดหมู่)

### 1.2 สินค้าหลัก (Products)
- สินค้าแต่ละรายการจะระบุราคาฐาน (**Base Price**) และ **ต้นทุน (Cost)** ไว้ใน Master
- **Fields:** `id`, `category_id` (FK), `name`, `base_price`, `cost`
- **Logic:** 
    - `base_price`: ราคาขายมาตรฐาน ใช้เป็นจุดเริ่มต้นเมื่อสร้างบิล
    - `cost`: ต้นทุนของสินค้านั้นๆ (ใช้คำนวณกำไรใน Dashboard โดยตรง)

### 1.3 ตัวเลือกสินค้า (Product Options)
- สร้างแยกจาก Master Data สามารถเลือกไปใช้ในหลาย Channel ได้
- ราคาของ Option คือมูลค่าเพิ่มเติม (Add-on cost)
- **Fields:** `id`, `name`, `price`
- **Example:** สินค้า A (45 บาท) + เพิ่มไข่ (10 บาท) = รวม 55 บาท

---

## 2. Sales Channel Management (ช่องทางการขาย)
จัดการข้อมูลการส่งต่อสินค้าไปยังแพลตฟอร์มต่างๆ เช่น Lineman, Grab, Robinhood

### 2.1 การตั้งค่า Channel
- **CRUD:** สร้าง Channel ใหม่ได้ โดยระบุ `Short Code` (เช่น LINEMAN -> `LMN`)
- **GP% (Gross Profit):** กำหนดเปอร์เซ็นต์กำไรที่คาดหวังสำหรับ Channel นั้นๆ (ใช้ในการคำนวณต้นทุน)
    - สูตรคำนวณ: `ต้นทุน = ราคาขาย / (1 + GP%)`
- **Example:** Lineman (GP 20%) หากขาย 60 บาท ต้นทุนจะคิดเป็น 50 บาท

### 2.2 ความสัมพันธ์กับสินค้า (Product Mapping)
- เมื่อสร้าง Channel ใหม่ ระบบควรมีฟังก์ชันคัดลอก (Copy) สินค้าและ Options จาก Master Data มาให้
- **Override Pricing:** สามารถปรับราคาเฉพาะ Channel ได้ (โดยไม่กระทบราคาใน Master Data)

---

## 3. Billing System (ระบบออกบิล)
ขั้นตอนการทำงานหลักเมื่อผู้ใช้ทำการรับออเดอร์

### 3.1 ขั้นตอนการสั่งสินค้า (Order Flow)
1. **เลือก Channel:** เลือกช่องทางที่จะออกบิล
2. **เลือกสินค้า:** สแกนหรือเลือก Product + Options จาก Channel นั้นๆ
3. **กรอกข้อมูล Header:**
    - ชื่อลูกค้า (Customer Name): Optional
    - วันที่ออกบิล (Bill Date): Optional (ถ้าไม่ใส่ ระบบใช้วันที่ปัจจุบัน)
4. **แสดงผล:** แสดงใบเสร็จ Preview (รายการสินค้า, ราคารวม)
5. **สร้างบิล (Create Bill):** กดปุ่มเพื่อบันทึกข้อมูลลง Database

### 3.2 การกำหนดเลขที่บิล (Receipt No Logic)
ระบบจะ Generate เลขที่บิลอัตโนมัติตามรูปแบบ:
$$ \text{Receipt No} = \text{Code} + \text{YYYYMMDD} + \text{Running Number} $$
- **Format:** `${ShortCode}${YYYYMMDD}${Seq}`
- **Example:** `LMN` + `20260703` + `0001` $\rightarrow$ **`LMN202607030001`**
- **Running Number:** เป็นเลขรันเริ่มใหม่ทุก 00.00 น. ของวันถัดไป (Reset Daily)

### 3.3 สถานะของบิล (Statuses)
- **Active:** บิลปกติ ยังไม่ได้ยกเลิก
- **Cancelled:** กด Cancel ทิ้งได้ (เมื่อสถานะเป็น Cancelled จำนวนเงินจะไม่นับใน Dashboard)

---

## 4. Dashboard & Analytics (แดชบอร์ดและรายงาน)
หน้าจอแสดงผลสรุปผลงาน

### 4.1 ตัวชี้วัดหลัก (KPI Cards)
แสดงผลยอดรวมทั้งหมด หรือ Filter ตาม Channel ที่เลือก:
1. **ยอดขายรวม (Total Sales):** ยอดเงินจากบิลสถานะ Active ทั้งหมด
2. **ต้นทุนรวม (Total Cost):** คำนวณจาก `cost` ของ Product ใน Master Data (+ ค่า Options ที่เลือก) 
3. **กำไรสุทธิ (Net Profit):** Sales - Cost
4. **จำนวนคำสั่งซื้อ (Order Count):** จำนวนบิลที่ยังไม่ Cancel

### 4.2 กราฟแสดงผล (Graph)
- แสดงยอดขายและกำไรแยกตามช่วงเวลา (**รายเดือน**)
- กราฟเปรียบเทียบระหว่าง Month ปัจจุบันกับเดือนก่อนหน้าได้

---

## 5. User Management (การจัดการผู้ใช้งาน)
### 5.1 ผู้ใช้งาน (Users)
- ระบบจัดการ User สำหรับ Login เข้าใช้งาน (สร้าง/แก้ไข User ได้)
- **Data Model:** `id`, `email`, `password`, `display_name`
- **Constraint:** ยังไม่ต้องซับซ้อนเรื่อง Permission (ทุกคนใช้ฟีเจอร์หลักได้เหมือนกัน)

---

## 6. Technical Notes for AI Agent
#### Database Schema Implications
1. **Product Cost:** Product มีฟิลด์ `cost` โดยตรง เพื่อใช้คำนวณกำไรใน Dashboard ได้แม่นยำยิ่งขึ้น (ไม่ต้องพึ่ง GP% ในการคำนวณต้นทุนเสมอไป แต่สามารถใช้ GP% ในการตั้งราคาขายได้)
2. **Product Mapping:** ต้องมีตารางกลางสำหรับเก็บความสัมพันธ์ระหว่าง `Channel` <-> `Product` เพื่อรองรับการ Override ราคา
2. **Receipt No Sequence:** ต้องแน่ใจว่า Sequence number ถูก Reset ตามวัน หากดึงข้อมูลจาก DB ตรงๆ (PostgREST)
3. **Cost Calculation:** ข้อมูล GP% ควรถูกเก็บไว้ใน `Channel` table เพื่อให้คำนวณได้ง่าย

#### UI/UX Flow
- เน้นความเรียบง่าย (Simple UX) สำหรับผู้ใช้จำนวนน้อย (1-2 คน)
- การเลือกสินค้าต้องรวดเร็ว (Support Keyboard/Shortcuts หากทำได้ง่าย)
- ผลลัพธ์สุดท้ายคือ "ใบเสร็จ" ที่แสดงชัดเจนก่อนกดบันทึก
